package versioned.host.exp.exponent.modules.api.components.camera;

import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Build;
import android.support.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.cameraview.AspectRatio;

import java.io.File;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import host.exp.exponent.utils.ExpFileUtils;

public class CameraViewManager extends ViewGroupManager<ExpoCameraView> {

  public enum Events {
    EVENT_CAMERA_READY("onCameraReady");

    private final String mName;

    Events(final String name) {
      mName = name;
    }

    @Override
    public String toString() {
      return mName;
    }
  }

  private static final String REACT_CLASS = "ExponentCamera";

  private static CameraViewManager instance;
  private ExpoCameraView mCameraView;

  public CameraViewManager() {
    super();
    instance = this;
  }

  public static CameraViewManager getInstance() { return instance; }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  protected ExpoCameraView createViewInstance(ThemedReactContext themedReactContext) {
    mCameraView = new ExpoCameraView(themedReactContext);
    return mCameraView;
  }

  @Override
  @Nullable
  public Map<String, Object> getExportedCustomDirectEventTypeConstants() {
    MapBuilder.Builder<String, Object> builder = MapBuilder.builder();
    for (Events event : Events.values()) {
      builder.put(event.toString(), MapBuilder.of("registrationName", event.toString()));
    }
    return builder.build();
  }

  @ReactProp(name = "type")
  public void setType(ExpoCameraView view, int type) {
    view.setFacing(type);
  }

  @ReactProp(name = "ratio")
  public void setRatio(ExpoCameraView view, String ratio) {
    view.setAspectRatio(AspectRatio.parse(ratio));
  }

  @ReactProp(name = "flashMode")
  public void setFlashMode(ExpoCameraView view, int torchMode) {
    view.setFlash(torchMode);
  }

  @ReactProp(name = "autoFocus")
  public void setAutoFocus(ExpoCameraView view, boolean autoFocus) {
    view.setAutoFocus(autoFocus);
  }

  @ReactProp(name = "focusDepth")
  public void setFocusDepth(ExpoCameraView view, float depth) {
    view.setFocusDepth(depth);
  }

  @ReactProp(name = "zoom")
  public void setZoom(ExpoCameraView view, float zoom) {
    view.setZoom(zoom);
  }

  @ReactProp(name = "whiteBalance")
  public void setWhiteBalance(ExpoCameraView view, int whiteBalance) {
    view.setWhiteBalance(whiteBalance);
  }

  public void takePicture(Promise promise) {
    if (!Build.FINGERPRINT.contains("generic")) {
      if (mCameraView.isCameraOpened()) {
        mCameraView.takePicture(promise);
      } else {
        promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
      }
    } else {
      promise.resolve(ExpFileUtils.uriFromFile(
        new File(mCameraView.writeImage(generateSimulatorPhoto()))
      ).toString());
    }
  }

  public Set<AspectRatio> getSupportedRatios() {
    if (mCameraView.isCameraOpened()) {
      return mCameraView.getSupportedAspectRatios();
    }
    return null;
  }

  private Bitmap generateSimulatorPhoto() {
    int width = mCameraView.getWidth();
    int height = mCameraView.getHeight();
    Bitmap fakePhoto = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888);
    Canvas canvas = new Canvas(fakePhoto);
    Paint background = new Paint();
    background.setColor(Color.BLACK);
    canvas.drawRect(0, 0, width, height, background);
    Paint textPaint = new Paint();
    textPaint.setColor(Color.YELLOW);
    textPaint.setTextSize(35);
    Calendar calendar = Calendar.getInstance();
    SimpleDateFormat simpleDateFormat = new SimpleDateFormat("dd.MM.YY HH:mm:ss", Locale.getDefault());
    canvas.drawText(simpleDateFormat.format(calendar.getTime()), width * 0.1f, height * 0.9f, textPaint);
    return fakePhoto;
  }
}
