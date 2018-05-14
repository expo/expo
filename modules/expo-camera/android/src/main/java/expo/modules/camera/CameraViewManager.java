package expo.modules.camera;

import android.content.Context;

import com.google.android.cameraview.AspectRatio;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import expo.core.ExpoProp;
import expo.core.ModuleRegistry;
import expo.core.ModuleRegistryConsumer;
import expo.core.ViewManager;
import expo.core.interfaces.UIManager;

public class CameraViewManager implements ModuleRegistryConsumer, ViewManager<ExpoCameraView> {
  public enum Events {
    EVENT_CAMERA_READY("onCameraReady"),
    EVENT_ON_MOUNT_ERROR("onMountError"),
    EVENT_ON_BAR_CODE_READ("onBarCodeRead"),
    EVENT_ON_FACES_DETECTED("onFacesDetected"),
    EVENT_ON_FACE_DETECTION_ERROR("onFaceDetectionError");

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
  private ModuleRegistry mModuleRegistry;

  @Override
  public void setModuleRegistry(ModuleRegistry moduleRegistry) {
    mModuleRegistry = moduleRegistry;
  }

  @Override
  public void onDropViewInstance(ExpoCameraView view) {
    mModuleRegistry.getModule(UIManager.class).unregisterLifecycleEventListener(view);
    view.stop();
  }

  @Override
  public String getName() {
    return REACT_CLASS;
  }

  @Override
  public ExpoCameraView createViewInstance(Context context) {
    return new ExpoCameraView(context, mModuleRegistry);
  }

  @Override
  public List<String> getExportedEventNames() {
    List<String> eventNames = new ArrayList<>(Events.values().length);
    for(Events event : Events.values()) {
      eventNames.add(event.toString());
    }
    return eventNames;
  }

  @ExpoProp(name = "type")
  public void setType(ExpoCameraView view, Double type) {
    view.setFacing(type.intValue());
  }

  @ExpoProp(name = "ratio")
  public void setRatio(ExpoCameraView view, String ratio) {
    view.setAspectRatio(AspectRatio.parse(ratio));
  }

  @ExpoProp(name = "flashMode")
  public void setFlashMode(ExpoCameraView view, Double torchMode) {
    view.setFlash(torchMode.intValue());
  }

  @ExpoProp(name = "autoFocus")
  public void setAutoFocus(ExpoCameraView view, Boolean autoFocus) {
    view.setAutoFocus(autoFocus);
  }

  @ExpoProp(name = "focusDepth")
  public void setFocusDepth(ExpoCameraView view, Double depth) {
    view.setFocusDepth(depth.floatValue());
  }

  @ExpoProp(name = "zoom")
  public void setZoom(ExpoCameraView view, Double zoom) {
    view.setZoom(zoom.floatValue());
  }

  @ExpoProp(name = "whiteBalance")
  public void setWhiteBalance(ExpoCameraView view, Double whiteBalance) {
    view.setWhiteBalance(whiteBalance.intValue());
  }

  @ExpoProp(name = "barCodeTypes")
  public void setBarCodeTypes(ExpoCameraView view, List barCodeTypes) {
    if (barCodeTypes == null) {
      return;
    }
    List<Integer> result = new ArrayList<>(barCodeTypes.size());
    for (int i = 0; i < barCodeTypes.size(); i++) {
      result.add(((Double) barCodeTypes.get(i)).intValue());
    }
    view.setBarCodeTypes(result);
  }

  @ExpoProp(name = "useCamera2Api")
  public void setUseCamera2Api(ExpoCameraView view, Boolean useCamera2Api) {
    view.setUsingCamera2Api(useCamera2Api);
  }

  @ExpoProp(name = "barCodeScannerEnabled")
  public void setBarCodeScanning(ExpoCameraView view, Boolean barCodeScannerEnabled) {
    view.setShouldScanBarCodes(barCodeScannerEnabled);
  }

  @ExpoProp(name = "faceDetectorEnabled")
  public void setFaceDetectorEnabled(ExpoCameraView view, Boolean faceDetectorEnabled) {
    view.setShouldDetectFaces(faceDetectorEnabled);
  }

  @ExpoProp(name = "faceDetectorSettings")
  public void setFaceDetectorSettings(ExpoCameraView view, Map settings) {
    view.setFaceDetectorSettings((Map<String, Object>) settings);
  }
}
