package expo.modules.gl.context;

import android.util.Log;

import expo.modules.gl.thread.GLSharedThread;
import expo.modules.gl.thread.GLThreadBase;

public class GLSharedContext extends GLContextBase {

  private GLSharedThread mGLThread;

  GLSharedContext(int exglCtxId, GLSharedThread sharedThread) {
    mEXGLCtxID = exglCtxId;
    mGLThread = sharedThread;
  }

  // remember to call if before adding any task on queue
  public void initlizeOnGLThread() {
    mGLThread.start();
  }

  @Override
  public void destroy() {
    if (mGLThread != null) {
      try {
        mGLThread.interrupt();
        mGLThread.join();
      } catch (InterruptedException e) {
        Log.e("EXGL", "Can't interrupt GL thread.", e);
      }
      mGLThread = null;
    }
  }

  @Override
  GLThreadBase getGLThread() {
    return mGLThread;
  }
}
