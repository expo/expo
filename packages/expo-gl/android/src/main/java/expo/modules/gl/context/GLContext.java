package expo.modules.gl.context;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.os.AsyncTask;
import android.util.Log;

import java.nio.IntBuffer;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import expo.core.ModuleRegistry;
import expo.core.Promise;
import expo.core.interfaces.JavaScriptContextProvider;
import expo.core.interfaces.services.UIManager;
import expo.modules.gl.GLObjectManagerModule;
import expo.modules.gl.TakeSnapshotAsyncTask;
import expo.modules.gl.thread.GLSharedThread;
import expo.modules.gl.thread.GLThread;
import expo.modules.gl.thread.GLThreadBase;

import static android.opengl.GLES30.*;
import static expo.modules.gl.cpp.EXGL.*;

public class GLContext extends GLContextBase {
  private final GLObjectManagerModule mManager;
  private GLThread mGLThread;

  private Map<Integer, GLContextChangeListener> mGLContextChangeListeners = new HashMap<>();
  private SurfaceTexture mSurfaceTexture;
  private List<GLSharedContext> mGLSharedContexts = new ArrayList<>();

  public GLContext(GLObjectManagerModule manager) {
    super();
    mManager = manager;
  }

  // must be called in GL thread
  public GLSharedContext createSharedGLContext() {
    if (mEXGLCtxID < 0) {
      return null;
    }
    GLSharedThread sharedThread = mGLThread.createSharedGLThread();
    GLSharedContext sharedContext = new GLSharedContext(mEXGLCtxID, sharedThread);
    mGLSharedContexts.add(sharedContext);
    return sharedContext;
  }

  private boolean isHeadless() {
    if (mGLThread != null) {
      return mSurfaceTexture == null;
    }
    return true;
  }

  public void initializeWithSurface(SurfaceTexture surfaceTexture, final Runnable completionCallback) {
    if (mGLThread != null) {
      return;
    }

    mSurfaceTexture = surfaceTexture;
    mGLThread = new GLThread(mSurfaceTexture);
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
          mEXGLCtxID = EXGLContextCreate(jsContextRef);
        }
        EXGLContextSetFlushMethod(mEXGLCtxID, glContext);
        mManager.saveContext(glContext);
        completionCallback.run();
      }
    });
  }

  public void flush() {
    runAsync(new Runnable() {
      @Override
      public void run() {
        // mEXGLCtxID may be unset if we get here (on the GL thread) before EXGLContextCreate(...) is
        // called on the JS thread (see above in the implementation of `initializeWithSurface(...)`)
        if (mEXGLCtxID > 0) {
          EXGLContextFlush(mEXGLCtxID);

          if (!isHeadless() && EXGLContextNeedsRedraw(mEXGLCtxID)) {
            if (!mGLThread.swapGLBuffers()) {
              Log.e("EXGL", "Cannot swap buffers!");
            }
            EXGLContextDrawEnded(mEXGLCtxID);
            for (GLContextChangeListener glContextChangeListener : mGLContextChangeListeners.values()) {
              glContextChangeListener.onGLContextUpdated();
            }
          }
        }
      }
    });
  }

  @Override
  public void destroy() {
    for (GLSharedContext sharedContext : mGLSharedContexts) {
      sharedContext.destroy();
    }
    if (mGLThread != null) {
      mManager.deleteContextWithId(mEXGLCtxID);
      EXGLContextDestroy(mEXGLCtxID);

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

  // must be called in GL thread
  private Map<String, Object> getViewportRect() {
    int[] viewport = new int[4];
    glGetIntegerv(GL_VIEWPORT, viewport, 0);

    Map<String, Object> results = new HashMap<>();
    results.put("x", viewport[0]);
    results.put("y", viewport[1]);
    results.put("width", viewport[2]);
    results.put("height", viewport[3]);

    return results;
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

        int x = (Integer) rect.get("x");
        int y = (Integer) rect.get("y");
        int width = (Integer) rect.get("width");
        int height = (Integer) rect.get("height");

        // Save surrounding framebuffer
        int[] prevFramebuffer = new int[1];
        glGetIntegerv(GL_FRAMEBUFFER_BINDING, prevFramebuffer, 0);

        // Set source framebuffer that we take snapshot from
        int sourceFramebuffer = isHeadless() ? prevFramebuffer[0] : 0;
        Map<String, Object> framebufferMap = options.containsKey("framebuffer") ? (Map<String, Object>) options.get("framebuffer") : null;

        if (framebufferMap != null && framebufferMap.containsKey("id")) {
          sourceFramebuffer = EXGLContextGetObject(mEXGLCtxID, (Integer) framebufferMap.get("id"));
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

        new TakeSnapshotAsyncTask(context, width, height, flip, format, compressionQuality, dataArray, promise)
            .executeOnExecutor(AsyncTask.THREAD_POOL_EXECUTOR);
      }
    });
  }

  public void registerGLContextChangeListener(GLContextChangeListener glContextChangeListener) {
    mGLContextChangeListeners.put(glContextChangeListener.getID(), glContextChangeListener);
  }

  public void unregisterGLContextChangeListener(GLContextChangeListener glContextChangeListener) {
    mGLContextChangeListeners.remove(glContextChangeListener.getID());
  }

  public interface GLContextChangeListener {
    int getID();
    void onGLContextUpdated();
  }
}
