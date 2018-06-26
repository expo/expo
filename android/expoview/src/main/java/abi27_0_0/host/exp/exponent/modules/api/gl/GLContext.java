package abi27_0_0.host.exp.exponent.modules.api.gl;


import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.opengl.EGL14;
import android.opengl.GLUtils;
import android.os.AsyncTask;

import abi27_0_0.com.facebook.react.bridge.Arguments;
import abi27_0_0.com.facebook.react.bridge.GuardedAsyncTask;
import abi27_0_0.com.facebook.react.bridge.JavaScriptContextHolder;
import abi27_0_0.com.facebook.react.bridge.Promise;
import abi27_0_0.com.facebook.react.bridge.ReactContext;
import abi27_0_0.com.facebook.react.bridge.ReadableMap;
import abi27_0_0.com.facebook.react.bridge.WritableMap;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.IntBuffer;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;

import host.exp.exponent.analytics.EXL;
import host.exp.exponent.utils.ExpFileUtils;
import host.exp.exponent.utils.ScopedContext;

import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.*;

public class GLContext {
  private int mEXGLCtxId = -1;

  private final GLObjectManagerModule mManager;
  private GLThread mGLThread;
  private EGLDisplay mEGLDisplay;
  private EGLSurface mEGLSurface;
  private EGLContext mEGLContext;
  private EGL10 mEGL;

  private BlockingQueue<Runnable> mEventQueue = new LinkedBlockingQueue<>();

  public GLContext(GLObjectManagerModule manager) {
    super();
    mManager = manager;
  }

  public int getContextId() {
    return mEXGLCtxId;
  }

  public boolean isHeadless() {
    if (mGLThread != null) {
      return mGLThread.mSurfaceTexture == null;
    }
    return true;
  }

  public void runAsync(Runnable r) {
    mEventQueue.add(r);
  }

  public void initialize(final ReactContext reactContext, SurfaceTexture surfaceTexture, final Runnable runnable) {
    if (mGLThread != null) {
      return;
    }

    mGLThread = new GLThread(surfaceTexture);
    mGLThread.start();

    // On JS thread, get JavaScriptCore context, create EXGL context, call JS callback
    final GLContext glContext = this;

    reactContext.runOnJSQueueThread(new Runnable() {
      @Override
      public void run() {
        JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder();
        synchronized (jsContext) {
          mEXGLCtxId = EXGLContextCreate(jsContext.get());
        }
        EXGLContextSetFlushMethod(mEXGLCtxId, glContext);
        mManager.saveContext(glContext);
        runnable.run();
      }
    });
  }

  public void flush() {
    runAsync(new Runnable() {
      @Override
      public void run() {
        // mEXGLCtxId may be unset if we get here (on the GL thread) before EXGLContextCreate(...) is
        // called on the JS thread (see above in the implementation of `initialize(...)`)

        if (mEXGLCtxId > 0) {
          EXGLContextFlush(mEXGLCtxId);

          if (!isHeadless() && EXGLContextNeedsRedraw(mEXGLCtxId)) {
            if (!mEGL.eglSwapBuffers(mEGLDisplay, mEGLSurface)) {
              EXL.e("GLView", "cannot swap buffers!");
            }
            EXGLContextDrawEnded(mEXGLCtxId);
          }
        }
      }
    });
  }

  public void destroy() {
    mManager.deleteContextWithId(mEXGLCtxId);
    EXGLContextDestroy(mEXGLCtxId);

    try {
      mGLThread.interrupt();
      mGLThread.join();
    } catch (InterruptedException e) {
      EXL.e("GLView", e);
    }
    mGLThread = null;
  }

  // must be called in GL thread
  private ReadableMap getViewportRect() {
    int[] viewport = new int[4];
    glGetIntegerv(GL_VIEWPORT, viewport, 0);

    WritableMap results = Arguments.createMap();
    results.putInt("x", viewport[0]);
    results.putInt("y", viewport[1]);
    results.putInt("width", viewport[2]);
    results.putInt("height", viewport[3]);

    return results;
  }

  public void takeSnapshot(final ReadableMap options, final ScopedContext scopedContext, final Promise promise) {
    flush();

    runAsync(new Runnable() {
      @Override
      public void run() {
        ReadableMap rect = options.hasKey("rect") ? options.getMap("rect") : getViewportRect();
        boolean flip = options.hasKey("flip") && options.getBoolean("flip");
        String format = options.hasKey("format") ? options.getString("format") : null;
        int compressionQuality = options.hasKey("compress") ? (int) (100 * options.getDouble("compress")) : 100;

        int x = rect.getInt("x");
        int y = rect.getInt("y");
        int width = rect.getInt("width");
        int height = rect.getInt("height");

        // Save surrounding framebuffer
        int[] prevFramebuffer = new int[1];
        glGetIntegerv(GL_FRAMEBUFFER_BINDING, prevFramebuffer, 0);

        // Set source framebuffer that we take snapshot from
        int sourceFramebuffer = isHeadless() ? prevFramebuffer[0] : 0;
        ReadableMap framebufferMap = options.hasKey("framebuffer") ? options.getMap("framebuffer") : null;

        if (framebufferMap != null && framebufferMap.hasKey("id")) {
          sourceFramebuffer = EXGLContextGetObject(mEXGLCtxId, framebufferMap.getInt("id"));
        }

        // Bind source framebuffer
        glBindFramebuffer(GL_FRAMEBUFFER, sourceFramebuffer);

        // Allocate pixel buffer and read pixels
        final int[] dataArray = new int[width * height];
        final IntBuffer dataBuffer = IntBuffer.wrap(dataArray);
        dataBuffer.position(0);
        glReadPixels(x, y, width, height, GL_RGBA, GL_UNSIGNED_BYTE, dataBuffer);

        // Restore surrounding framebuffer
        glBindFramebuffer(GL_FRAMEBUFFER, prevFramebuffer[0]);

        new TakeSnapshot(scopedContext, width, height, flip, format, compressionQuality, dataArray, promise)
            .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
      }
    });
  }

  private static class TakeSnapshot extends GuardedAsyncTask<Void, Void> {
    private final ScopedContext mScopedContext;
    private final int mWidth;
    private final int mHeight;
    private final boolean mFlip;
    private final String mFormat;
    private final int mCompress;
    private final int[] mDataArray;
    private final Promise mPromise;

    TakeSnapshot(ScopedContext scopedContext, int width, int height, boolean flip, String format, int compress, int[] dataArray, Promise promise) {
      super((ReactContext) scopedContext.getContext());
      mScopedContext = scopedContext;
      mWidth = width;
      mHeight = height;
      mFlip = flip;
      mFormat = format;
      mCompress = compress;
      mDataArray = dataArray;
      mPromise = promise;
    }

    @Override
    protected void doInBackgroundGuarded(Void... params) {
      // Convert RGBA data format to bitmap's ARGB
      for (int i = 0; i < mHeight; i++) {
        for (int j = 0; j < mWidth; j++) {
          int offset = i * mWidth + j;
          int pixel = mDataArray[offset];
          int blue = (pixel >> 16) & 0xff;
          int red = (pixel << 16) & 0x00ff0000;
          mDataArray[offset] = (pixel & 0xff00ff00) | red | blue;
        }
      }

      // Create Bitmap and flip
      Bitmap bitmap = Bitmap.createBitmap(mDataArray, mWidth, mHeight, Bitmap.Config.ARGB_8888);

      if (!mFlip) {
        // the bitmap is automatically flipped on Android, however we may want to unflip it
        // in case we take a snapshot from framebuffer that is already flipped
        Matrix flipMatrix = new Matrix();
        flipMatrix.postScale(1, -1, mWidth / 2, mHeight / 2);
        bitmap = Bitmap.createBitmap(bitmap, 0, 0, mWidth, mHeight, flipMatrix, true);
      }

      // Write bitmap to file
      String path = null;
      String extension = ".jpeg";
      FileOutputStream output = null;
      Bitmap.CompressFormat compressFormat = Bitmap.CompressFormat.JPEG;

      if (mFormat != null && mFormat.equals("png")) {
        compressFormat = Bitmap.CompressFormat.PNG;
        extension = ".png";
      }

      try {
        path = ExpFileUtils.generateOutputPath(mScopedContext.getCacheDir(), "GLView", extension);
        output = new FileOutputStream(path);
        bitmap.compress(compressFormat, mCompress, output);
        output.flush();
        output.close();
        output = null;

      } catch (Exception e) {
        e.printStackTrace();
        mPromise.reject("E_GL_CANT_SAVE_SNAPSHOT", e.getMessage());
      }

      if (output == null) {
        // Return result object which imitates Expo.Asset so it can be used again to fill the texture
        WritableMap result = Arguments.createMap();
        String fileUri = ExpFileUtils.uriFromFile(new File(path)).toString();

        result.putString("uri", fileUri);
        result.putString("localUri", fileUri);
        result.putInt("width", mWidth);
        result.putInt("height", mHeight);

        mPromise.resolve(result);
      }
    }
  }


  // All actual GL calls are made on this thread

  private class GLThread extends Thread {
    private SurfaceTexture mSurfaceTexture;

    private static final int EGL_CONTEXT_CLIENT_VERSION = 0x3098;

    GLThread(SurfaceTexture surfaceTexture) {
      mSurfaceTexture = surfaceTexture;
    }

    @Override
    public void run() {
      initEGL();

      while (true) {
        try {
          makeEGLContextCurrent();
          mEventQueue.take().run();
          checkEGLError();
        } catch (InterruptedException e) {
          break;
        }
      }

      deinitEGL();
    }

    public void setSurfaceTexture(SurfaceTexture surfaceTexture) {
      mSurfaceTexture = surfaceTexture;
    }

    private EGLContext createGLContext(int contextVersion, EGLConfig eglConfig) {
      int[] attribs = { EGL_CONTEXT_CLIENT_VERSION, contextVersion, EGL10.EGL_NONE };
      return mEGL.eglCreateContext(mEGLDisplay, eglConfig, EGL10.EGL_NO_CONTEXT, attribs);
    }

    // Creates headless GL context if surfaceTexture == null
    private EGLSurface createGLSurface(EGLConfig eglConfig, SurfaceTexture surfaceTexture) {
      if (surfaceTexture == null) {
        // Some devices are crashing when pbuffer surface doesn't have EGL_WIDTH and EGL_HEIGHT attributes set
        int[] surfaceAttribs = {
            EGL10.EGL_WIDTH, 1,
            EGL10.EGL_HEIGHT, 1,
            EGL10.EGL_NONE
        };
        return mEGL.eglCreatePbufferSurface(mEGLDisplay, eglConfig, surfaceAttribs);
      } else {
        return mEGL.eglCreateWindowSurface(mEGLDisplay, eglConfig, surfaceTexture, null);
      }
    }

    private void initEGL() {
      mEGL = (EGL10) EGLContext.getEGL();

      // Get EGLDisplay and initialize display connection
      mEGLDisplay = mEGL.eglGetDisplay(EGL10.EGL_DEFAULT_DISPLAY);
      if (mEGLDisplay == EGL10.EGL_NO_DISPLAY) {
        throw new RuntimeException("eglGetDisplay failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
      }
      int[] version = new int[2];
      if (!mEGL.eglInitialize(mEGLDisplay, version)) {
        throw new RuntimeException("eglInitialize failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
      }

      // Find a compatible EGLConfig
      int[] configsCount = new int[1];
      EGLConfig[] configs = new EGLConfig[1];
      int[] configSpec = {
          EGL10.EGL_RENDERABLE_TYPE, EGL14.EGL_OPENGL_ES2_BIT,
          EGL10.EGL_RED_SIZE, 8, EGL10.EGL_GREEN_SIZE, 8, EGL10.EGL_BLUE_SIZE, 8,
          EGL10.EGL_ALPHA_SIZE, 8, EGL10.EGL_DEPTH_SIZE, 16, EGL10.EGL_STENCIL_SIZE, 0,
          EGL10.EGL_NONE,
      };
      EGLConfig eglConfig = null;
      if (!mEGL.eglChooseConfig(mEGLDisplay, configSpec, configs, 1, configsCount)) {
        throw new IllegalArgumentException("eglChooseConfig failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
      } else if (configsCount[0] > 0) {
        eglConfig = configs[0];
      }
      if (eglConfig == null) {
        throw new RuntimeException("eglConfig not initialized");
      }

      // Create EGLContext and EGLSurface
      mEGLContext = createGLContext(3, eglConfig);
      if (mEGLContext == null || mEGLContext == EGL10.EGL_NO_CONTEXT) {
        mEGLContext = createGLContext(2, eglConfig);
      }
      checkEGLError();
      mEGLSurface = createGLSurface(eglConfig, mSurfaceTexture);
      checkEGLError();
      if (mEGLSurface == null || mEGLSurface == EGL10.EGL_NO_SURFACE) {
        int error = mEGL.eglGetError();
        throw new RuntimeException("eglCreateWindowSurface failed " + GLUtils.getEGLErrorString(error));
      }

      // Switch to our EGLContext
      makeEGLContextCurrent();
      checkEGLError();

      // Enable buffer preservation -- allows app to draw over previous frames without clearing
      EGL14.eglSurfaceAttrib(EGL14.eglGetCurrentDisplay(), EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW),
          EGL14.EGL_SWAP_BEHAVIOR, EGL14.EGL_BUFFER_PRESERVED);
      checkEGLError();
    }

    private void deinitEGL() {
      makeEGLContextCurrent();
      mEGL.eglDestroySurface(mEGLDisplay, mEGLSurface);
      checkEGLError();
      mEGL.eglDestroyContext(mEGLDisplay, mEGLContext);
      checkEGLError();
      mEGL.eglTerminate(mEGLDisplay);
      checkEGLError();
    }

    private void makeEGLContextCurrent() {
      if (!mEGLContext.equals(mEGL.eglGetCurrentContext()) ||
          !mEGLSurface.equals(mEGL.eglGetCurrentSurface(EGL10.EGL_DRAW))) {
        checkEGLError();
        if (!mEGL.eglMakeCurrent(mEGLDisplay, mEGLSurface, mEGLSurface, mEGLContext)) {
          throw new RuntimeException("eglMakeCurrent failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
        }
        checkEGLError();
      }
    }

    private void checkEGLError() {
      final int error = mEGL.eglGetError();
      if (error != EGL10.EGL_SUCCESS) {
        EXL.e("GLView", "EGL error = 0x" + Integer.toHexString(error));
      }
    }
  }
}
