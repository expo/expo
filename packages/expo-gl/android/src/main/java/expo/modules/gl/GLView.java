package expo.modules.gl;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.os.Bundle;
import android.view.TextureView;

import java.util.ArrayList;
import java.util.List;

import expo.core.ModuleRegistry;
import expo.core.interfaces.services.EventEmitter;
import expo.modules.gl.context.GLContext;

public class GLView extends TextureView implements TextureView.SurfaceTextureListener {
  private boolean mOnSurfaceCreateCalled = false;

  private GLContext mGLContext;
  private ModuleRegistry mModuleRegistry;
  private List<OnSurfaceTextureChangedListener> mOnSurfaceTextureChangedListeners = new ArrayList<>();
  private int mWidth = -1;
  private int mHeight = -1;
  private SurfaceTexture mSurfaceTexture;

  // Suppresses ViewConstructor warnings
  public GLView(Context context) {
    super(context);
  }

  public GLView(Context context, ModuleRegistry moduleRegistry) {
    super(context);
    setSurfaceTextureListener(this);
    setOpaque(false);

    GLObjectManagerModule objectManager = (GLObjectManagerModule)moduleRegistry.getExportedModuleOfClass(GLObjectManagerModule.class);
    mGLContext = new GLContext(objectManager);
    mModuleRegistry = moduleRegistry;
  }

  // Public interface to allow running events on GL thread

  public void runOnGLThread(Runnable r) {
    mGLContext.runAsync(r);
  }

  public GLContext getGLContext() {
    return mGLContext;
  }

  // `TextureView.SurfaceTextureListener` events

  @Override
  public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
    if (!mOnSurfaceCreateCalled) {
      mWidth = width;
      mHeight = height;
      mSurfaceTexture = surface;
      mGLContext.initializeWithSurface(surface, new Runnable() {
        @Override
        public void run() {
          final Bundle event = new Bundle();
          final EventEmitter eventEmitter = mModuleRegistry.getModule(EventEmitter.class);

          event.putInt("exglCtxId", mGLContext.getEXGLContextId());

          eventEmitter.emit(getId(), new EventEmitter.BaseEvent() {
            @Override
            public String getEventName() {
              return "onSurfaceCreate";
            }

            @Override
            public Bundle getEventBody() {
              return event;
            }
          });
        }
      });
      mOnSurfaceCreateCalled = true;

      for (OnSurfaceTextureChangedListener listener: mOnSurfaceTextureChangedListeners) {
        listener.onSurfaceTextureAvailable(surface, width, height);
      }
    }
  }

  @Override
  public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
    for (OnSurfaceTextureChangedListener listener: mOnSurfaceTextureChangedListeners) {
      listener.onSurfaceTextureDestroyed(surface);
    }

    // cleanup
    mWidth = -1;
    mHeight = -1;
    mSurfaceTexture = null;

    mGLContext.destroy();

    // reset flag, so the context will be recreated when the new surface is available
    mOnSurfaceCreateCalled = false;

    return true;
  }

  @Override
  public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
    mWidth = width;
    mHeight = height;
    for (OnSurfaceTextureChangedListener listener: mOnSurfaceTextureChangedListeners) {
      listener.onSurfaceTextureSizeChanged(surface, width, height);
    }
  }

  @Override
  public void onSurfaceTextureUpdated(SurfaceTexture surface) {
    for (OnSurfaceTextureChangedListener listener: mOnSurfaceTextureChangedListeners) {
      listener.onSurfaceTextureUpdated(surface);
    }
  }

  public void registerOnSurfaceTextureUpdatedListener(OnSurfaceTextureChangedListener listener) {
    mOnSurfaceTextureChangedListeners.add(listener);
    // provide immediate callback for surfaceTexture creation if one's already available
    if (mOnSurfaceCreateCalled && mSurfaceTexture != null) {
      listener.onSurfaceTextureAvailable(mSurfaceTexture, mWidth, mHeight);
    }
  }

  public interface OnSurfaceTextureChangedListener {
    void onSurfaceTextureAvailable(SurfaceTexture surfaceTexture, int width, int height);
    void onSurfaceTextureUpdated(SurfaceTexture surfaceTexture);
    void onSurfaceTextureSizeChanged(SurfaceTexture surfaceTexture, int width, int height);
    void onSurfaceTextureDestroyed(SurfaceTexture surfaceTexture);
  }
}

