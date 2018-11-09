package expo.modules.gl.context;

import expo.modules.gl.thread.GLThreadBase;

abstract class GLContextBase {
  int mEXGLCtxID = -1;

  public int getEXGLContextId() {
    return mEXGLCtxID;
  }

  public void runAsync(Runnable glThreadRunnable) {
    getGLThread().addRunnable(glThreadRunnable);
  }

  abstract void destroy();

  abstract GLThreadBase getGLThread();
}
