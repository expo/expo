package expo.modules.gl;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.os.Bundle;
import android.view.TextureView;

import org.unimodules.core.ModuleRegistry;
import org.unimodules.core.interfaces.services.EventEmitter;

public class GLView extends TextureView implements TextureView.SurfaceTextureListener {
  private boolean mOnSurfaceCreateCalled = false;
  private boolean mOnSurfaceTextureCreatedWithZeroSize = false;

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
  synchronized public void onSurfaceTextureAvailable(SurfaceTexture surfaceTexture, int width, int height) {
    if (!mOnSurfaceCreateCalled) {
      // onSurfaceTextureAvailable is sometimes called with 0 size texture
      // and immediately followed by onSurfaceTextureSizeChanged with actual size
      if (width == 0 || height == 0) {
        mOnSurfaceTextureCreatedWithZeroSize = true;
      }

      if (!mOnSurfaceTextureCreatedWithZeroSize) {
        initializeSurfaceInGLContext(surfaceTexture);
      }

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
  synchronized public void onSurfaceTextureSizeChanged(SurfaceTexture surfaceTexture, int width, int height) {
    if (mOnSurfaceTextureCreatedWithZeroSize && (width != 0 || height != 0)) {
      initializeSurfaceInGLContext(surfaceTexture);
      mOnSurfaceTextureCreatedWithZeroSize = false;
    }
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

  private void initializeSurfaceInGLContext(SurfaceTexture surfaceTexture) {
    mGLContext.initialize(surfaceTexture, new Runnable() {
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
  }
}

