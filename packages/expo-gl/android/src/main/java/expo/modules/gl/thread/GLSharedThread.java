package expo.modules.gl.thread;

import android.opengl.EGL14;
import android.opengl.GLUtils;

import javax.microedition.khronos.egl.EGL10;
import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.egl.EGLContext;
import javax.microedition.khronos.egl.EGLDisplay;
import javax.microedition.khronos.egl.EGLSurface;

public class GLSharedThread extends GLThreadBase {
  private static final int EGL_CONTEXT_CLIENT_VERSION = 0x3098;
  private EGLSurface mEGLSurface;
  private EGLContext mEGLContext;
  private EGLContext mParentEGLContext;
  private EGLDisplay mEGLDisplay;
  private EGLConfig mEGLConfig;

  GLSharedThread(EGLContext parentEGLContext, EGLDisplay parentEGLDisplay, EGLConfig parentEGLConfig) {
    super();
    mParentEGLContext = parentEGLContext;
    mEGLDisplay = parentEGLDisplay;
    mEGLConfig = parentEGLConfig;
  }

  @Override
  void initEGL() {
    mEGL = (EGL10) EGLContext.getEGL();

    mEGLSurface = createEGLSurface(mEGLDisplay, mEGLConfig);
    if (mEGLSurface == null || mEGLSurface == EGL10.EGL_NO_SURFACE) {
      checkEGLError("eglCreateSurface");
    }
    mEGLContext = createEGLContext(mEGLDisplay, mEGLConfig, mParentEGLContext, 3);
    if (mEGLContext == null || mEGLContext == EGL10.EGL_NO_CONTEXT) {
      mEGLContext = createEGLContext(mEGLDisplay, mEGLConfig, mParentEGLContext, 2);
      checkEGLError("eglCreateContext");
    }

    addRunnable(new Runnable() {
      @Override
      public void run() {
        EGL14.eglSurfaceAttrib(
            EGL14.eglGetCurrentDisplay(),
            EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW),
            EGL14.EGL_SWAP_BEHAVIOR,
            EGL14.EGL_BUFFER_PRESERVED
            );
      }
    });
  }

  private EGLSurface createEGLSurface(EGLDisplay eglDisplay, EGLConfig eglConfig) {
    int[] surfaceAttribs = {
        EGL10.EGL_WIDTH, 1,
        EGL10.EGL_HEIGHT, 1,
        EGL10.EGL_NONE,
    };
    return mEGL.eglCreatePbufferSurface(eglDisplay, eglConfig, surfaceAttribs);
  }

  private EGLContext createEGLContext(EGLDisplay eglDisplay, EGLConfig eglConfig, EGLContext parentContext, int eglContextVersion) {
    int[] contextAttribs = {
        EGL_CONTEXT_CLIENT_VERSION, eglContextVersion,
        EGL10.EGL_NONE,
    };
    return mEGL.eglCreateContext(eglDisplay, eglConfig, parentContext, contextAttribs);
  }

  @Override
  void deinitEGL() {
    makeEGLContextCurrent();
    if (!mEGL.eglDestroySurface(mEGLDisplay, mEGLSurface)) {
      checkEGLError();
    }
    if (!mEGL.eglDestroyContext(mEGLDisplay, mEGLContext)) {
      checkEGLError();
    }
  }

  @Override
  void makeEGLContextCurrent() {
    if (!mEGLContext.equals(mEGL.eglGetCurrentContext()) ||
        !mEGLSurface.equals(mEGL.eglGetCurrentSurface(EGL10.EGL_DRAW))) {
      checkEGLError();
      if (!mEGL.eglMakeCurrent(mEGLDisplay, mEGLSurface, mEGLSurface, mEGLContext)) {
        throw new RuntimeException("eglMakeCurrent failed " + GLUtils.getEGLErrorString(mEGL.eglGetError()));
      }
      checkEGLError();
    }
  }
}
