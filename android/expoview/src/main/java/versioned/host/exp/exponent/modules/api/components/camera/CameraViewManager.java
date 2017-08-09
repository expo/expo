package versioned.host.exp.exponent.modules.api.components.camera;

import android.support.annotation.Nullable;

import com.facebook.react.bridge.Promise;
import com.facebook.react.common.MapBuilder;
import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.annotations.ReactProp;
import com.google.android.cameraview.AspectRatio;

import java.util.Map;
import java.util.Set;

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
    if (mCameraView.isCameraOpened()) {
      mCameraView.takePicture(promise);
    } else {
      promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running");
    }
  }

  public Set<AspectRatio> getSupportedRatios() {
    if (mCameraView.isCameraOpened()) {
      return mCameraView.getSupportedAspectRatios();
    }
    return null;
  }
}
