package expo.modules.camera.next

import android.Manifest
import android.util.Log
import expo.modules.camera.VIDEO_1080P
import expo.modules.camera.VIDEO_2160P
import expo.modules.camera.VIDEO_480P
import expo.modules.camera.VIDEO_4x3
import expo.modules.camera.VIDEO_720P
import expo.modules.camera.next.records.BarCodeSettings
import expo.modules.camera.next.records.CameraMode
import expo.modules.camera.next.records.CameraType
import expo.modules.camera.next.records.FlashMode
import expo.modules.camera.next.tasks.ResolveTakePicture
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.File

val cameraEvents = arrayOf(
  "onCameraReady",
  "onMountError",
  "onBarCodeScanned",
  "onFacesDetected",
  "onFaceDetectionError",
  "onPictureSaved"
)

class CameraViewNextModule : Module() {
  private val moduleScope = CoroutineScope(Dispatchers.Main)
  override fun definition() = ModuleDefinition {
    Name("ExpoCameraNext")

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

    AsyncFunction("takePicture") { options: PictureOptions, viewTag: Int, promise: Promise ->
      val view = findView(viewTag)

      if (!EmulatorUtilities.isRunningOnEmulator()) {
        view.takePicture(options, promise, cacheDirectory)
      } else {
        val image = CameraViewHelper.generateSimulatorPhoto(view.width, view.height)
        moduleScope.launch {
          ResolveTakePicture(image, promise, options, cacheDirectory) { response ->
            view.onPictureSaved(response)
          }.resolve()
        }
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("record") { options: RecordingOptions, viewTag: Int, promise: Promise ->
      val view = findView(viewTag)

      if (!view.mute && !permissionsManager.hasGrantedPermissions(Manifest.permission.RECORD_AUDIO)) {
        throw Exceptions.MissingPermissions(Manifest.permission.RECORD_AUDIO)
      }

      view.record(options, promise, cacheDirectory)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stopRecording") { viewTag: Int ->
      val view = findView(viewTag)
      view.activeRecording?.close()
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

    OnDestroy {
      try {
        moduleScope.cancel(ModuleDestroyedException())
      } catch (e: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
    }

    View(ExpoCameraView::class) {
      Events(cameraEvents)

      Prop("type") { view, type: CameraType ->
        view.lenFacing = type
      }

      Prop("flashMode") { view, flashMode: FlashMode ->
        view.setCameraFlashMode(flashMode)
      }

      Prop("enableTorch") { view, enabled: Boolean ->
        view.setTorchEnabled(enabled)
      }

      Prop("zoom") { view, zoom: Float ->
        view.camera?.cameraControl?.setLinearZoom(zoom)
      }

      Prop("mode") { view, mode: CameraMode ->
        view.cameraMode = mode
      }

      Prop("mute") { view, muted: Boolean? ->
        view.mute = muted ?: false
      }

      Prop("barCodeScannerSettings") { view, settings: BarCodeSettings? ->
        if (settings == null) {
          return@Prop
        }
        view.setBarCodeScannerSettings(settings)
      }

      Prop("barCodeScannerEnabled") { view, barCodeScannerEnabled: Boolean? ->
        view.setShouldScanBarCodes(barCodeScannerEnabled ?: false)
      }

      OnViewDestroys { view ->
        view.cancelCoroutineScope()
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

  companion object {
    internal val TAG = CameraViewNextModule::class.java.simpleName
  }
}
