package expo.modules.camera

import android.content.Context

import com.google.android.cameraview.AspectRatio
import com.google.android.cameraview.Size

import expo.modules.core.interfaces.ExpoProp
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.ViewManager
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings

class CameraViewManager(
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ViewManager<ExpoCameraView>() {

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  enum class Events(private val eventsName: String) {
    EVENT_CAMERA_READY("onCameraReady"),
    EVENT_ON_MOUNT_ERROR("onMountError"),
    EVENT_ON_BAR_CODE_SCANNED("onBarCodeScanned"),
    EVENT_ON_FACES_DETECTED("onFacesDetected"),
    EVENT_ON_FACE_DETECTION_ERROR("onFaceDetectionError"),
    EVENT_ON_PICTURE_SAVED("onPictureSaved");
    override fun toString() = eventsName
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun onDropViewInstance(view: ExpoCameraView) {
    val uIManager: UIManager by moduleRegistry()
    uIManager.unregisterLifecycleEventListener(view)
    view.stop()
  }

  override fun getName() = REACT_CLASS

  override fun getViewManagerType() = ViewManagerType.GROUP

  override fun createViewInstance(context: Context) =
    ExpoCameraView(context, moduleRegistryDelegate)

  override fun getExportedEventNames() = Events.values().map {
    it.toString()
  }

  @ExpoProp(name = "type")
  fun setType(view: ExpoCameraView, type: Int) {
    view.facing = type
  }

  @ExpoProp(name = "ratio")
  fun setRatio(view: ExpoCameraView, ratio: String?) {
    view.setAspectRatio(AspectRatio.parse(ratio))
  }

  @ExpoProp(name = "flashMode")
  fun setFlashMode(view: ExpoCameraView, torchMode: Int) {
    view.flash = torchMode
  }

  @ExpoProp(name = "autoFocus")
  fun setAutoFocus(view: ExpoCameraView, autoFocus: Boolean) {
    view.autoFocus = autoFocus
  }

  @ExpoProp(name = "focusDepth")
  fun setFocusDepth(view: ExpoCameraView, depth: Float) {
    view.focusDepth = depth
  }

  @ExpoProp(name = "zoom")
  fun setZoom(view: ExpoCameraView, zoom: Float) {
    view.zoom = zoom
  }

  @ExpoProp(name = "whiteBalance")
  fun setWhiteBalance(view: ExpoCameraView, whiteBalance: Int) {
    view.whiteBalance = whiteBalance
  }

  @ExpoProp(name = "pictureSize")
  fun setPictureSize(view: ExpoCameraView, size: String?) {
    view.pictureSize = Size.parse(size)
  }

  @ExpoProp(name = "barCodeScannerSettings")
  fun setBarCodeScannerSettings(view: ExpoCameraView, settings: Map<String?, Any?>?) {
    view.setBarCodeScannerSettings(BarCodeScannerSettings(settings))
  }

  @ExpoProp(name = "useCamera2Api")
  fun setUseCamera2Api(view: ExpoCameraView, useCamera2Api: Boolean) {
    view.setUsingCamera2Api(useCamera2Api)
  }

  @ExpoProp(name = "barCodeScannerEnabled")
  fun setBarCodeScanning(view: ExpoCameraView, barCodeScannerEnabled: Boolean) {
    view.setShouldScanBarCodes(barCodeScannerEnabled)
  }

  @ExpoProp(name = "faceDetectorEnabled")
  fun setFaceDetectorEnabled(view: ExpoCameraView, faceDetectorEnabled: Boolean) {
    view.setShouldDetectFaces(faceDetectorEnabled)
  }

  @ExpoProp(name = "faceDetectorSettings")
  fun setFaceDetectorSettings(view: ExpoCameraView, settings: Map<String, Any>?) {
    view.setFaceDetectorSettings(settings)
  }
}
