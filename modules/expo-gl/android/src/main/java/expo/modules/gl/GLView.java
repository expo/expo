package expo.modules.gl;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.os.Bundle;
import android.view.TextureView;

import expo.core.ModuleRegistry;
import expo.core.interfaces.services.EventEmitter;

public class GLView extends TextureView implements TextureView.SurfaceTextureListener {
  private boolean mOnSurfaceCreateCalled = false;

  private GLContext mGLContext;
  private ModuleRegistry mModuleRegistry;

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
      mGLContext.initialize(getContext(), surface, new Runnable() {
        @Override
        public void run() {
          final Bundle event = new Bundle();
          final EventEmitter eventEmitter = mModuleRegistry.getModule(EventEmitter.class);

          event.putInt("exglCtxId", mGLContext.getContextId());

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
    }
  }

  @Override
  public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
    mGLContext.destroy();

    // reset flag, so the context will be recreated when the new surface is available
    mOnSurfaceCreateCalled = false;

    return true;
  }

  @Override
  public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
  }

  @Override
  public void onSurfaceTextureUpdated(SurfaceTexture surface) {
  }

  public void flush() {
    mGLContext.flush();
  }

  public int getEXGLCtxId() {
    return mGLContext.getContextId();
  }
}

