package versioned.host.exp.exponent.modules.api.gl;

import android.content.Context;

import static android.opengl.GLES11Ext.GL_TEXTURE_EXTERNAL_OES;
import static android.opengl.GLES20.*;

import android.graphics.PixelFormat;
import android.graphics.SurfaceTexture;
import android.hardware.Camera;
import android.opengl.EGL14;
import android.opengl.GLSurfaceView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import java.io.IOException;
import java.nio.ByteBuffer;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

import host.exp.exponent.analytics.EXL;

import static host.exp.exponent.exgl.EXGL.*;

public class GLView extends GLSurfaceView implements GLSurfaceView.Renderer, SurfaceTexture.OnFrameAvailableListener {
  private boolean onSurfaceCreateCalled = false;
  private int exglCtxId = -1;

  public GLView(Context context) {
    super(context);

    setEGLContextClientVersion(2);
    setEGLConfigChooser(8, 8, 8, 8, 16, 0);
    getHolder().setFormat(PixelFormat.TRANSLUCENT);
    setRenderer(this);
  }

  private int mCameraGLTexture;
  private Camera mCamera;
  private SurfaceTexture mCameraSurfaceTexture;
  private boolean mCameraTextureUpdated;

  public void onSurfaceCreated(GL10 unused, EGLConfig config) {
    EGL14.eglSurfaceAttrib(EGL14.eglGetCurrentDisplay(), EGL14.eglGetCurrentSurface(EGL14.EGL_DRAW),
            EGL14.EGL_SWAP_BEHAVIOR, EGL14.EGL_BUFFER_PRESERVED);

    if (!onSurfaceCreateCalled) {
      // On JS thread, get JavaScriptCore context, create EXGL context, call JS callback
      final ReactContext reactContext = (ReactContext) getContext();
      reactContext.runOnJSQueueThread(new Runnable() {
        @Override
        public void run() {
          exglCtxId = EXGLContextCreate(reactContext.getJavaScriptContext());
          WritableMap arg = Arguments.createMap();
          arg.putInt("exglCtxId", exglCtxId);
          reactContext.getJSModule(RCTEventEmitter.class).receiveEvent(getId(), "surfaceCreate", arg);
        }
      });
      onSurfaceCreateCalled = true;

      int[] textures = new int[1];
      glGenTextures(1, textures, 0);
      mCameraGLTexture = textures[0];
      glBindTexture(GL_TEXTURE_EXTERNAL_OES, mCameraGLTexture);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_S, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_WRAP_T, GL_CLAMP_TO_EDGE);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MAG_FILTER, GL_LINEAR);
      glTexParameteri(GL_TEXTURE_EXTERNAL_OES, GL_TEXTURE_MIN_FILTER, GL_LINEAR);

      mCameraSurfaceTexture = new SurfaceTexture(mCameraGLTexture);
      mCameraSurfaceTexture.setOnFrameAvailableListener(this);

      mCamera = Camera.open();
      try {
        mCamera.setPreviewTexture(mCameraSurfaceTexture);
      } catch (IOException e) {
        EXL.e("EXGL", "Couldn't set preview texture for camera.");
      }
      mCamera.startPreview();
    }
  }

  @Override
  public void onFrameAvailable(SurfaceTexture surfaceTexture) {
    mCameraTextureUpdated = true;
  }

  public void onDrawFrame(GL10 unused) {
    if (mCameraTextureUpdated) {
      mCameraTextureUpdated = false;
      mCameraSurfaceTexture.updateTexImage();
      glActiveTexture(GL_TEXTURE0);
      glBindTexture(GL_TEXTURE_2D, mCameraGLTexture);
    }

    // exglCtxId may be unset if we get here (on the GL thread) before EXGLContextCreate(...) is
    // called on the JS thread to create the EXGL context and save its id (see above in
    // the implementation of `onSurfaceCreated(...)`)
    if (exglCtxId > 0) {
      EXGLContextFlush(exglCtxId);
    }
  }

  public void onSurfaceChanged(GL10 unused, int width, int height) {
  }

  public void onDetachedFromWindow() {
    EXGLContextDestroy(exglCtxId);
    super.onDetachedFromWindow();
  }
}
