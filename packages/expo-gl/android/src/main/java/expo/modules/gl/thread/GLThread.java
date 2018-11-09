package expo.modules.gl.thread;

import android.graphics.SurfaceTexture;
import android.opengl.EGL14;
import android.opengl.GLUtils;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;

public class GLThread extends GLThreadBase {

  private static final int EGL_CONTEXT_CLIENT_VERSION = 0x3098;

  private SurfaceTexture mSurfaceTexture;
  private EGLDisplay mEGLDisplay;
  private EGLSurface mEGLSurface;
  private EGLContext mEGLContext;
  private EGLConfig mEGLConfig;

  public GLThread(SurfaceTexture surfaceTexture) {
    super();
    mSurfaceTexture = surfaceTexture;
  }

  public GLSharedThread createSharedGLThread() {
    return new GLSharedThread(mEGLContext, mEGLDisplay, mEGLConfig);
  }

  public boolean swapGLBuffers() {
    return mEGL.eglSwapBuffers(mEGLDisplay, mEGLSurface);
  }

  @Override
  void initEGL() {
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

  @Override
  void deinitEGL() {
    makeEGLContextCurrent();
    destroySurface(mEGLSurface);
    checkEGLError();
    mEGL.eglDestroyContext(mEGLDisplay, mEGLContext);
    checkEGLError();
    mEGL.eglTerminate(mEGLDisplay);
    checkEGLError();
  }

  @Override
  void makeEGLContextCurrent() {
    if (!mEGLContext.equals(mEGL.eglGetCurrentContext()) ||
        !mEGLSurface.equals(mEGL.eglGetCurrentSurface(EGL10.EGL_DRAW))) {
      checkEGLError();
      if (!makeCurrent(mEGLSurface)) {
        throw new RuntimeException("eglMakeCurrent failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
      }
      checkEGLError();
    }
  }

  private boolean makeCurrent(EGLSurface eglSurface) {
    return mEGL.eglMakeCurrent(mEGLDisplay, eglSurface, eglSurface, mEGLContext);
  }

  // Creates Pbuffer surface for headless rendering if surfaceTexture == null
  private EGLSurface createSurface(EGLConfig eglConfig, SurfaceTexture surfaceTexture) {
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

  private boolean destroySurface(EGLSurface eglSurface) {
    return mEGL.eglDestroySurface(mEGLDisplay, eglSurface);
  }

  private EGLContext createGLContext(int contextVersion, EGLConfig eglConfig) {
    int[] attribs = {EGL_CONTEXT_CLIENT_VERSION, contextVersion, EGL10.EGL_NONE};
    return mEGL.eglCreateContext(mEGLDisplay, eglConfig, EGL10.EGL_NO_CONTEXT, attribs);
  }
}
