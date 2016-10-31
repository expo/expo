package versioned.host.exp.exponent.modules.api.gl;

import android.content.Context;
import static android.opengl.GLES20.*;

import android.graphics.PixelFormat;
import android.opengl.EGL14;
import android.opengl.GLSurfaceView;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.uimanager.events.RCTEventEmitter;

import javax.microedition.khronos.egl.EGLConfig;
import javax.microedition.khronos.opengles.GL10;

import static host.exp.exponent.exgl.EXGL.*;

public class GLView extends GLSurfaceView implements GLSurfaceView.Renderer {
  private boolean onSurfaceCreateCalled = false;
  private int exglCtxId = -1;

  public GLView(Context context) {
    super(context);

    setEGLContextClientVersion(2);
    setEGLConfigChooser(8, 8, 8, 8, 16, 0);
    getHolder().setFormat(PixelFormat.TRANSLUCENT);
    setRenderer(this);
  }

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
    }
  }

  public void onDrawFrame(GL10 unused) {
    // The EXGLContextId might not be set yet if onDrawFrame, which is called on the GL thread, is
    // called before EXGLContextCreate has been called on the JS thread
    if (exglCtxId > 0) { // zero indicates invalid EXGLContextId
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
