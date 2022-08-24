package expo.modules.camera

import com.google.android.cameraview.AspectRatio
import com.google.android.cameraview.Size
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.lang.ref.WeakReference

class CameraViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExponentCamera")

    ViewManager {
      View {
        ExpoCameraView(it, WeakReference(appContext))
      }

      Events(
        "onCameraReady",
        "onMountError",
        "onBarCodeScanned",
        "onFacesDetected",
        "onFaceDetectionError",
        "onPictureSaved"
      )

      OnViewDestroys<ExpoCameraView> { view ->
        val uiManager = appContext.legacyModule<UIManager>()
        uiManager?.unregisterLifecycleEventListener(view)
        view.stop()
      }

      Prop("type") { view: ExpoCameraView, type: Int ->
        view.facing = type
      }

      Prop("ratio") { view: ExpoCameraView, ratio: String? ->
        if (ratio == null) {
          return@Prop
        }
        view.setAspectRatio(AspectRatio.parse(ratio))
      }

      Prop("flashMode") { view: ExpoCameraView, torchMode: Int ->
        view.flash = torchMode
      }

      Prop("autoFocus") { view: ExpoCameraView, autoFocus: Boolean ->
        view.autoFocus = autoFocus
      }

      Prop("focusDepth") { view: ExpoCameraView, depth: Float ->
        view.focusDepth = depth
      }

      Prop("zoom") { view: ExpoCameraView, zoom: Float ->
        view.zoom = zoom
      }

      Prop("whiteBalance") { view: ExpoCameraView, whiteBalance: Int ->
        view.whiteBalance = whiteBalance
      }

      Prop("pictureSize") { view: ExpoCameraView, size: String? ->
        if (size == null) {
          return@Prop
        }
        view.pictureSize = Size.parse(size)
      }

      Prop("barCodeScannerSettings") { view: ExpoCameraView, settings: Map<String, Any?>? ->
        view.setBarCodeScannerSettings(BarCodeScannerSettings(settings))
      }

      Prop("useCamera2Api") { view: ExpoCameraView, useCamera2Api: Boolean ->
        view.setUsingCamera2Api(useCamera2Api)
      }

      Prop("barCodeScannerEnabled") { view: ExpoCameraView, barCodeScannerEnabled: Boolean ->
        view.setShouldScanBarCodes(barCodeScannerEnabled)
      }

      Prop("faceDetectorEnabled") { view: ExpoCameraView, faceDetectorEnabled: Boolean ->
        view.setShouldDetectFaces(faceDetectorEnabled)
      }

      Prop("faceDetectorSettings") { view: ExpoCameraView, settings: Map<String, Any>? ->
        view.setFaceDetectorSettings(settings)
      }
    }
  }
}
