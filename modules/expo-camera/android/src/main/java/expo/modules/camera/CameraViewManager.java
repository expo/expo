package expo.modules.camera;

import android.content.Context;

import com.google.android.cameraview.AspectRatio;
import com.google.android.cameraview.Size;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import expo.core.ViewManager;
import expo.core.interfaces.ExpoProp;
import expo.core.ModuleRegistry;
import expo.core.interfaces.ModuleRegistryConsumer;
import expo.core.interfaces.services.UIManager;

public class CameraViewManager extends ViewManager<ExpoCameraView> implements ModuleRegistryConsumer {
  public enum Events {
    EVENT_CAMERA_READY("onCameraReady"),
    EVENT_ON_MOUNT_ERROR("onMountError"),
    EVENT_ON_BAR_CODE_READ("onBarCodeRead"),
    EVENT_ON_FACES_DETECTED("onFacesDetected"),
    EVENT_ON_FACE_DETECTION_ERROR("onFaceDetectionError"),
    EVENT_ON_PICTURE_SAVED("onPictureSaved");

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
  public ViewManagerType getViewManagerType() {
    return ViewManagerType.GROUP;
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
  public void setType(ExpoCameraView view, int type) {
    view.setFacing(type);
  }

  @ExpoProp(name = "ratio")
  public void setRatio(ExpoCameraView view, String ratio) {
    view.setAspectRatio(AspectRatio.parse(ratio));
  }

  @ExpoProp(name = "flashMode")
  public void setFlashMode(ExpoCameraView view, int torchMode) {
    view.setFlash(torchMode);
  }

  @ExpoProp(name = "autoFocus")
  public void setAutoFocus(ExpoCameraView view, boolean autoFocus) {
    view.setAutoFocus(autoFocus);
  }

  @ExpoProp(name = "focusDepth")
  public void setFocusDepth(ExpoCameraView view, float depth) {
    view.setFocusDepth(depth);
  }

  @ExpoProp(name = "zoom")
  public void setZoom(ExpoCameraView view, float zoom) {
    view.setZoom(zoom);
  }

  @ExpoProp(name = "whiteBalance")
  public void setWhiteBalance(ExpoCameraView view, int whiteBalance) {
    view.setWhiteBalance(whiteBalance);
  }

  @ExpoProp(name = "pictureSize")
  public void setPictureSize(ExpoCameraView view, String size) {
    view.setPictureSize(Size.parse(size));
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
  public void setUseCamera2Api(ExpoCameraView view, boolean useCamera2Api) {
    view.setUsingCamera2Api(useCamera2Api);
  }

  @ExpoProp(name = "barCodeScannerEnabled")
  public void setBarCodeScanning(ExpoCameraView view, boolean barCodeScannerEnabled) {
    view.setShouldScanBarCodes(barCodeScannerEnabled);
  }

  @ExpoProp(name = "faceDetectorEnabled")
  public void setFaceDetectorEnabled(ExpoCameraView view, boolean faceDetectorEnabled) {
    view.setShouldDetectFaces(faceDetectorEnabled);
  }

  @ExpoProp(name = "faceDetectorSettings")
  public void setFaceDetectorSettings(ExpoCameraView view, Map<String, Object> settings) {
    view.setFaceDetectorSettings(settings);
  }
}
