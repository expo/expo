package expo.modules.camera

import com.google.android.cameraview.AspectRatio
import com.google.android.cameraview.Size
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CameraViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExponentCamera")

    View(ExpoCameraView::class) {
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
        view.cameraView.stop()
      }

      Prop("type") { view: ExpoCameraView, type: Int ->
        view.cameraView.facing = type
      }

      Prop("ratio") { view: ExpoCameraView, ratio: String? ->
        if (ratio == null) {
          return@Prop
        }
        view.cameraView.setAspectRatio(AspectRatio.parse(ratio))
      }

      Prop("flashMode") { view: ExpoCameraView, torchMode: Int ->
        view.cameraView.flash = torchMode
      }

      Prop("autoFocus") { view: ExpoCameraView, autoFocus: Boolean ->
        view.cameraView.autoFocus = autoFocus
      }

      Prop("focusDepth") { view: ExpoCameraView, depth: Float ->
        view.cameraView.focusDepth = depth
      }

      Prop("zoom") { view: ExpoCameraView, zoom: Float ->
        view.cameraView.zoom = zoom
      }

      Prop("whiteBalance") { view: ExpoCameraView, whiteBalance: Int ->
        view.cameraView.whiteBalance = whiteBalance
      }

      Prop("pictureSize") { view: ExpoCameraView, size: String? ->
        if (size == null) {
          return@Prop
        }
        view.cameraView.pictureSize = Size.parse(size)
      }

      Prop("barCodeScannerSettings") { view: ExpoCameraView, settings: Map<String, Any?>? ->
        view.setBarCodeScannerSettings(BarCodeScannerSettings(settings))
      }

      Prop("useCamera2Api") { view: ExpoCameraView, useCamera2Api: Boolean ->
        view.cameraView.setUsingCamera2Api(useCamera2Api)
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
