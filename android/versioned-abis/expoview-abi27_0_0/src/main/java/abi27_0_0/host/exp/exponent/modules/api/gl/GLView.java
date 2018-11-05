package abi27_0_0.host.exp.exponent.modules.api.gl;

import android.content.Context;
import android.graphics.SurfaceTexture;
import android.view.TextureView;

import abi27_0_0.com.facebook.react.bridge.Arguments;
import abi27_0_0.com.facebook.react.bridge.ReactContext;
import abi27_0_0.com.facebook.react.bridge.WritableMap;
import abi27_0_0.com.facebook.react.uimanager.events.RCTEventEmitter;

public class GLView extends TextureView implements TextureView.SurfaceTextureListener {
  private boolean mOnSurfaceCreateCalled = false;

  private GLContext mGLContext;

  public GLView(Context context) {
    super(context);
    setSurfaceTextureListener(this);
    setOpaque(false);

    ReactContext reactContext = (ReactContext) context;
    GLObjectManagerModule objectManager = reactContext.getNativeModule(GLObjectManagerModule.class);
    mGLContext = new GLContext(objectManager);
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
      final ReactContext reactContext = (ReactContext) getContext();

      mGLContext.initialize(reactContext, surface, new Runnable() {
        @Override
        public void run() {
          WritableMap arg = Arguments.createMap();
          arg.putInt("exglCtxId", mGLContext.getContextId());
          reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "surfaceCreate", arg);
        }
      });
      mOnSurfaceCreateCalled = true;
    }
  }

  @Override
  public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
    mGLContext.destroy();
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

