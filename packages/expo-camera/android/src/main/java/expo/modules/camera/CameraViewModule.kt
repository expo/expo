package expo.modules.camera

import android.Manifest
import androidx.camera.core.ImageCapture.FLASH_MODE_AUTO
import androidx.camera.core.ImageCapture.FLASH_MODE_OFF
import androidx.camera.core.ImageCapture.FLASH_MODE_ON
import com.google.android.cameraview.AspectRatio
import expo.modules.camera.records.CameraType
import expo.modules.camera.records.FlashMode
import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask
import expo.modules.core.interfaces.services.UIManager
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.interfaces.barcodescanner.BarCodeScannerSettings
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

val cameraEvents = arrayOf(
  "onCameraReady",
  "onMountError",
  "onBarCodeScanned",
  "onFacesDetected",
  "onFaceDetectionError",
  "onPictureSaved"
)

class CameraViewModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoCamera")

    Constants(
      "Type" to mapOf(
        "front" to CameraType.FRONT.value,
        "back" to CameraType.BACK.value
      ),
      "FlashMode" to mapOf(
        "off" to FlashMode.OFF.value,
        "on" to FlashMode.ON.value,
        "auto" to FlashMode.AUTO.value,
      ),
      "VideoQuality" to mapOf(
        "2160p" to VIDEO_2160P,
        "1080p" to VIDEO_1080P,
        "720p" to VIDEO_720P,
        "480p" to VIDEO_480P,
        "4:3" to VIDEO_4x3
      ),
    )

    AsyncFunction("pausePreview") { viewTag: Int ->
      val view = findView(viewTag)

//      if (view.cameraView.isCameraOpened) {
//        view.cameraView.pausePreview()
//      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("resumePreview") { viewTag: Int ->
      val view = findView(viewTag)

//      if (view.cameraView.isCameraOpened) {
//        view.cameraView.resumePreview()
//      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("takePicture") { options: PictureOptions, viewTag: Int, promise: Promise ->
      val view = findView(viewTag)

      if (!EmulatorUtilities.isRunningOnEmulator()) {
        view.takePicture(options, promise, cacheDirectory)
      } else {
        val image = CameraViewHelper.generateSimulatorPhoto(view.width, view.height)
        ResolveTakenPictureAsyncTask(image, promise, options, cacheDirectory, view).execute()
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("record") { options: RecordingOptions, viewTag: Int, promise: Promise ->
      if (!options.mute && !permissionsManager.hasGrantedPermissions(Manifest.permission.RECORD_AUDIO)) {
        throw Exceptions.MissingPermissions(Manifest.permission.RECORD_AUDIO)
      }

      val view = findView(viewTag)

      view.record(options, promise, cacheDirectory)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stopRecording") { viewTag: Int ->
//      val view = findView(viewTag)
//
//
//      if (view.cameraView.isCameraOpened) {
//        view.cameraView.stopRecording()
//      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.CAMERA
      )
    }

    AsyncFunction("requestCameraPermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.CAMERA
      )
    }

    AsyncFunction("requestMicrophonePermissionsAsync") { promise: Promise ->
      Permissions.askForPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.RECORD_AUDIO
      )
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.CAMERA
      )
    }

    AsyncFunction("getCameraPermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.CAMERA
      )
    }

    AsyncFunction("getMicrophonePermissionsAsync") { promise: Promise ->
      Permissions.getPermissionsWithPermissionsManager(
        permissionsManager,
        promise,
        Manifest.permission.RECORD_AUDIO
      )
    }

    View(ExpoCameraView::class) {
      Events(cameraEvents)

      OnViewDestroys<ExpoCameraView> { view ->
        val uiManager = appContext.legacyModule<UIManager>()
        uiManager?.unregisterLifecycleEventListener(view)
      }

      Prop("type") { view, type: CameraType ->
        view.cameraSelectorFacing = type
      }

      Prop("flashMode") { view, torchMode: FlashMode ->
        view.flashMode = torchMode
      }

      Prop("enableTorch") { view, enable: Boolean ->
        view.torchEnabled = enable
      }

      Prop("zoom") { view, zoom: Float ->
        view.camera?.cameraControl?.setLinearZoom(zoom)
      }

      Prop("barCodeScannerSettings") { view, settings: Map<String, Any?>? ->
        if (settings == null) {
          return@Prop
        }
        view.setBarCodeScannerSettings(BarCodeScannerSettings(settings))
      }

      Prop("barCodeScannerEnabled") { view, barCodeScannerEnabled: Boolean? ->
        view.setShouldScanBarCodes(barCodeScannerEnabled ?: false)
      }

      Prop("faceDetectorEnabled") { view, faceDetectorEnabled: Boolean? ->
        view.setShouldDetectFaces(faceDetectorEnabled ?: false)
      }

      Prop("faceDetectorSettings") { view, settings: Map<String, Any>? ->
        view.setFaceDetectorSettings(settings)
      }
    }
  }

  private val cacheDirectory: File
    get() = appContext.cacheDirectory

  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()

  private fun findView(viewTag: Int): ExpoCameraView {
    return appContext.findView(viewTag)
      ?: throw Exceptions.ViewNotFound(ExpoCameraView::class, viewTag)
  }
}
