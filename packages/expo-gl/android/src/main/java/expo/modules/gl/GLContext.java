package expo.modules.gl;


import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.Matrix;
import android.graphics.SurfaceTexture;
import android.net.Uri;
import android.opengl.EGL14;
import android.opengl.GLUtils;
import android.os.AsyncTask;
import android.os.Bundle;
import android.util.Log;

import java.io.File;
import java.io.FileOutputStream;
import java.lang.ref.WeakReference;
import java.nio.IntBuffer;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.JavaScriptContextProvider;
import expo.core.interfaces.services.UIManager;
import expo.modules.gl.utils.FileSystemUtils;

import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.*;

public class GLContext {
  private int mEXGLCtxId = -1;

  private final GLObjectManagerModule mManager;
  private GLThread mGLThread;
  private EGLDisplay mEGLDisplay;
  private EGLSurface mEGLSurface;
  private EGLContext mEGLContext;
  private EGLConfig mEGLConfig;
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

  public void initialize(SurfaceTexture surfaceTexture, final Runnable completionCallback) {
    if (mGLThread != null) {
      return;
    }

    mGLThread = new GLThread(surfaceTexture);
    mGLThread.start();

    // On JS thread, get JavaScriptCore context, create EXGL context, call JS callback
    final GLContext glContext = this;
    ModuleRegistry moduleRegistry = mManager.getModuleRegistry();
    final UIManager uiManager = moduleRegistry.getModule(UIManager.class);
    final JavaScriptContextProvider jsContextProvider = moduleRegistry.getModule(JavaScriptContextProvider.class);

    uiManager.runOnClientCodeQueueThread(new Runnable() {
      @Override
      public void run() {
        long jsContextRef = jsContextProvider.getJavaScriptContextRef();
        synchronized (uiManager) {
          mEXGLCtxId = EXGLContextCreate(jsContextRef);
        }
        EXGLContextSetFlushMethod(mEXGLCtxId, glContext);
        mManager.saveContext(glContext);
        completionCallback.run();
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
            if (!swapBuffers(mEGLSurface)) {
              Log.e("EXGL", "Cannot swap buffers!");
            }
            EXGLContextDrawEnded(mEXGLCtxId);
          }
        }
      }
    });
  }

  public boolean swapBuffers(EGLSurface eglSurface) {
    return mEGL.eglSwapBuffers(mEGLDisplay, eglSurface);
  }

  public boolean makeCurrent(EGLSurface eglSurface) {
    return mEGL.eglMakeCurrent(mEGLDisplay, eglSurface, eglSurface, mEGLContext);
  }

  // Creates Pbuffer surface for headless rendering if surfaceTexture == null
  public EGLSurface createSurface(EGLConfig eglConfig, Object surfaceTexture) {
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

  public boolean destroySurface(EGLSurface eglSurface) {
    return mEGL.eglDestroySurface(mEGLDisplay, eglSurface);
  }

  public void destroy() {
    if (mGLThread != null) {
      mManager.deleteContextWithId(mEXGLCtxId);
      EXGLContextDestroy(mEXGLCtxId);

      try {
        mGLThread.interrupt();
        mGLThread.join();
      } catch (InterruptedException e) {
        Log.e("EXGL", "Can't interrupt GL thread.", e);
      }
      mGLThread = null;
    }
  }

  // must be called in GL thread
  public Map<String, Object> getViewportRect() {
    int[] viewport = new int[4];
    glGetIntegerv(GL_VIEWPORT, viewport, 0);

    Map<String, Object> results = new HashMap<>();
    results.put("x", viewport[0]);
    results.put("y", viewport[1]);
    results.put("width", viewport[2]);
    results.put("height", viewport[3]);

    return results;
  }

  public EGLConfig getEGLConfig() {
    return mEGLConfig;
  }

  public void takeSnapshot(final Map<String, Object> options, final Context context, final Promise promise) {
    flush();

    runAsync(new Runnable() {
      @Override
      public void run() {
        Map<String, Object> rect = options.containsKey("rect") ? (Map<String, Object>) options.get("rect") : getViewportRect();
        Boolean flip = options.containsKey("flip") && (Boolean) options.get("flip");
        String format = options.containsKey("format") ? (String) options.get("format") : null;
        int compressionQuality = options.containsKey("compress") ? (int) (100.0 * (Double) options.get("compress")) : 100;

        int x = castNumberToInt(rect.get("x"));
        int y = castNumberToInt(rect.get("y"));
        int width = castNumberToInt(rect.get("width"));
        int height = castNumberToInt(rect.get("height"));

        // Save surrounding framebuffer
        int[] prevFramebuffer = new int[1];
        glGetIntegerv(GL_FRAMEBUFFER_BINDING, prevFramebuffer, 0);

        // Set source framebuffer that we take snapshot from
        int sourceFramebuffer = isHeadless() ? prevFramebuffer[0] : 0;
        Map<String, Object> framebufferMap = options.containsKey("framebuffer") ? (Map<String, Object>) options.get("framebuffer") : null;

        if (framebufferMap != null && framebufferMap.containsKey("id")) {
          Integer framebufferId = castNumberToInt(framebufferMap.get("id"));
          sourceFramebuffer = EXGLContextGetObject(mEXGLCtxId, framebufferId);
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

        new TakeSnapshot(context, width, height, flip, format, compressionQuality, dataArray, promise)
            .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
      }
    });
  }

  private static class TakeSnapshot extends AsyncTask<Void, Void, Void> {
    private final WeakReference<Context> mContext;
    private final int mWidth;
    private final int mHeight;
    private final boolean mFlip;
    private final String mFormat;
    private final int mCompress;
    private final int[] mDataArray;
    private final Promise mPromise;

    TakeSnapshot(Context context, int width, int height, boolean flip, String format, int compress, int[] dataArray, Promise promise) {
      mContext = new WeakReference<>(context);
      mWidth = width;
      mHeight = height;
      mFlip = flip;
      mFormat = format;
      mCompress = compress;
      mDataArray = dataArray;
      mPromise = promise;
    }

    @Override
    protected Void doInBackground(Void... params) {
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

      Context context = mContext.get();

      if (context == null) {
        mPromise.reject("E_GL_CONTEXT_DESTROYED", "Context has been garbage collected.");
        return null;
      }

      try {
        path = FileSystemUtils.generateOutputPath(context.getCacheDir(), "GLView", extension);
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
        Bundle result = new Bundle();
        String fileUri = Uri.fromFile(new File(path)).toString();

        result.putString("uri", fileUri);
        result.putString("localUri", fileUri);
        result.putInt("width", mWidth);
        result.putInt("height", mHeight);

        mPromise.resolve(result);
      }
      return null;
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

    private EGLContext createGLContext(int contextVersion, EGLConfig eglConfig) {
      int[] attribs = {EGL_CONTEXT_CLIENT_VERSION, contextVersion, EGL10.EGL_NONE};
      return mEGL.eglCreateContext(mEGLDisplay, eglConfig, EGL10.EGL_NO_CONTEXT, attribs);
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
      if (!mEGL.eglChooseConfig(mEGLDisplay, configSpec, configs, 1, configsCount)) {
        throw new IllegalArgumentException("eglChooseConfig failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
      } else if (configsCount[0] > 0) {
        mEGLConfig = configs[0];
      }
      if (mEGLConfig == null) {
        throw new RuntimeException("eglConfig not initialized");
      }

      // Create EGLContext and EGLSurface
      mEGLContext = createGLContext(3, mEGLConfig);
      if (mEGLContext == null || mEGLContext == EGL10.EGL_NO_CONTEXT) {
        mEGLContext = createGLContext(2, mEGLConfig);
      }
      checkEGLError();
      mEGLSurface = createSurface(mEGLConfig, mSurfaceTexture);
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
      destroySurface(mEGLSurface);
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
        if (!makeCurrent(mEGLSurface)) {
          throw new RuntimeException("eglMakeCurrent failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
        }
        checkEGLError();
      }
    }

    private void checkEGLError() {
      final int error = mEGL.eglGetError();
      if (error != EGL10.EGL_SUCCESS) {
        Log.e("EXGL", "EGL error = 0x" + Integer.toHexString(error));
      }
    }
  }

  // Solves number casting problem as number values can come as Integer or Double.
  private int castNumberToInt(Object value) {
    if (value instanceof Double) {
      return ((Double) value).intValue();
    }
    return (Integer) value;
  }
}
