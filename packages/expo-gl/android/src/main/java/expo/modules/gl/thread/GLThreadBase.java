package expo.modules.gl.thread;

import android.util.Log;

import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

import javax.microedition.khronos.egl.EGL10;

public abstract class GLThreadBase extends Thread {

  private BlockingQueue<Runnable> mEventQueue;
  EGL10 mEGL;

  GLThreadBase() {
    mEventQueue = new LinkedBlockingQueue<>();
  }

  public void addRunnable(Runnable r) {
    mEventQueue.add(r);
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

  void checkEGLError(String tag) {
    final int error = mEGL.eglGetError();
    if (error != EGL10.EGL_SUCCESS) {
      Log.e("EXGL " + tag, "EGL error = 0x" + Integer.toHexString(error));
    }
  }
  void checkEGLError() {
    checkEGLError("");
  }

  abstract void initEGL();

  abstract void deinitEGL();

  abstract void makeEGLContextCurrent();
}
