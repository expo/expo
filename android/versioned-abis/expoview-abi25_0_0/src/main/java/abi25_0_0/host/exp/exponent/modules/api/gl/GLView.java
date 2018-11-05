package abi25_0_0.host.exp.exponent.modules.api.gl;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.opengl.EGL14;
import android.opengl.GLUtils;
import android.util.SparseArray;
import android.view.TextureView;

import abi25_0_0.com.facebook.react.bridge.Arguments;
import abi25_0_0.com.facebook.react.bridge.JavaScriptContextHolder;
import abi25_0_0.com.facebook.react.bridge.ReactContext;
import abi25_0_0.com.facebook.react.bridge.WritableMap;
import abi25_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

import java.util.ArrayList;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;

import host.exp.exponent.analytics.EXL;

import static expo.modules.gl.cpp.EXGL.*;

public class GLView extends TextureView implements TextureView.SurfaceTextureListener  {
  private boolean mOnSurfaceCreateCalled = false;
  private int mEXGLCtxId = -1;

  private GLThread mGLThread;

  private static SparseArray<GLView> mGLViewMap = new SparseArray<>();
  private ArrayList<Runnable> mEventQueue = new ArrayList<>();

  public GLView(Context context) {
    super(context);
    setSurfaceTextureListener(this);
    setOpaque(false);
  }


  // Public interface to allow running events on GL thread

  public synchronized void runOnGLThread(Runnable r) {
    mEventQueue.add(r);
  }

  public static synchronized void runOnGLThread(int exglCtxId, Runnable r) {
    GLView glView = mGLViewMap.get(exglCtxId);
    if (glView != null) {
      glView.runOnGLThread(r);
    }
  }


  // `TextureView.SurfaceTextureListener` events

  @Override
  public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
    mGLThread = new GLThread(surface);
    mGLThread.start();

    final GLView glView = this;
    if (!mOnSurfaceCreateCalled) {
      // On JS thread, get JavaScriptCore context, create EXGL context, call JS callback
      final ReactContext reactContext = (ReactContext) getContext();
      reactContext.runOnJSQueueThread(new Runnable() {
        @Override
        public void run() {
          JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder();
          synchronized (jsContext) {
            mEXGLCtxId = EXGLContextCreate(jsContext.get());
          }
          mGLViewMap.put(mEXGLCtxId, glView);
          WritableMap arg = Arguments.createMap();
          arg.putInt("exglCtxId", mEXGLCtxId);
          reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "surfaceCreate", arg);
        }
      });
      mOnSurfaceCreateCalled = true;
    }
  }

  @Override
  public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
    mGLViewMap.remove(mEXGLCtxId);
    EXGLContextDestroy(mEXGLCtxId);

    try {
      mGLThread.interrupt();
      mGLThread.join();
    } catch (InterruptedException e) {
      EXL.e("GLView", e);
    }
    mGLThread = null;

    return true;
  }

  @Override
  public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
  }

  @Override
  public void onSurfaceTextureUpdated(SurfaceTexture surface) {
  }


  // All actual GL calls are made on this thread

  private class GLThread extends Thread {
    private final SurfaceTexture mSurfaceTexture;

    private static final int EGL_CONTEXT_CLIENT_VERSION = 0x3098;
    private EGLDisplay mEGLDisplay;
    private EGLSurface mEGLSurface;
    private EGLContext mEGLContext;
    private EGL10 mEGL;

    GLThread(SurfaceTexture surfaceTexture) {
      mSurfaceTexture = surfaceTexture;
    }

    @Override
    public void run() {
      initEGL();

      while (true) {
        try {
          makeEGLContextCurrent();

          // Flush any queued events
          for (Runnable r : mEventQueue) {
            r.run();
          }
          mEventQueue.clear();

          // mEXGLCtxId may be unset if we get here (on the GL thread) before EXGLContextCreate(...) is
          // called on the JS thread (see above in the implementation of `onSurfaceTextureAvailable(...)`)
          if (mEXGLCtxId > 0) {
            EXGLContextFlush(mEXGLCtxId);
          }

          if (!mEGL.eglSwapBuffers(mEGLDisplay, mEGLSurface)) {
            EXL.e("GLView", "cannot swap buffers!");
          }
          checkEGLError();

          Thread.sleep(1000 / 60);
        } catch (InterruptedException e) {
          break;
        }
      }

      deinitEGL();
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
      int[] attribs = { EGL_CONTEXT_CLIENT_VERSION, 2, EGL10.EGL_NONE };
      mEGLContext = mEGL.eglCreateContext(mEGLDisplay, eglConfig, EGL10.EGL_NO_CONTEXT, attribs);
      checkEGLError();
      mEGLSurface = mEGL.eglCreateWindowSurface(mEGLDisplay, eglConfig, mSurfaceTexture, null);
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

