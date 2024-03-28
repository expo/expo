package expo.modules.camera.next

import android.Manifest
import android.util.Log
import expo.modules.camera.next.records.BarcodeSettings
import expo.modules.camera.next.records.CameraMode
import expo.modules.camera.next.records.CameraType
import expo.modules.camera.next.records.FlashMode
import expo.modules.camera.next.records.VideoQuality
import expo.modules.camera.next.tasks.ResolveTakenPicture
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
  "onBarcodeScanned",
  "onFacesDetected",
  "onFaceDetectionError",
  "onPictureSaved"
)

class CameraViewNextModule : Module() {
  private val moduleScope = CoroutineScope(Dispatchers.Main)
  override fun definition() = ModuleDefinition {
    Name("ExpoCameraNext")

    Events("onModernBarcodeScanned")

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

      Prop("facing") { view, facing: CameraType? ->
        facing?.let {
          if (view.lenFacing != facing) {
            view.lenFacing = it
          }
        }
      }

      Prop("flashMode") { view, flashMode: FlashMode? ->
        flashMode?.let {
          view.setCameraFlashMode(it)
        }
      }

      Prop("enableTorch") { view, enabled: Boolean? ->
        view.setTorchEnabled(enabled ?: false)
      }

      Prop("zoom") { view, zoom: Float? ->
        zoom?.let {
          view.camera?.cameraControl?.setLinearZoom(it)
        }
      }

      Prop("mode") { view, mode: CameraMode? ->
        mode?.let {
          if (view.cameraMode != mode) {
            view.cameraMode = it
          }
        }
      }

      Prop("mute") { view, muted: Boolean? ->
        muted?.let {
          if (it != view.mute) {
            view.mute = it
          }
        }
      }

      Prop("videoQuality") { view, quality: VideoQuality? ->
        quality?.let {
          view.videoQuality = it
        }
      }

      Prop("barcodeScannerSettings") { view, settings: BarcodeSettings? ->
        if (settings == null) {
          return@Prop
        }
        view.setBarcodeScannerSettings(settings)
      }

      Prop("barcodeScannerEnabled") { view, enabled: Boolean? ->
        enabled?.let {
          view.setShouldScanBarcodes(enabled)
        }
      }

      Prop("pictureSize") { view, pictureSize: String? ->
        pictureSize?.let {
          if (view.pictureSize != pictureSize) {
            view.pictureSize = it
          }
        }
      }

      AsyncFunction("takePicture") { view: ExpoCameraView, options: PictureOptions, promise: Promise ->
        if (!EmulatorUtilities.isRunningOnEmulator()) {
          view.takePicture(options, promise, cacheDirectory)
        } else {
          val image = CameraViewHelper.generateSimulatorPhoto(view.width, view.height)
          moduleScope.launch {
            ResolveTakenPicture(image, promise, options, cacheDirectory) { response ->
              view.onPictureSaved(response)
            }.resolve()
          }
        }
      }.runOnQueue(Queues.MAIN)

      AsyncFunction("getAvailablePictureSizes") { view: ExpoCameraView ->
        return@AsyncFunction view.getAvailablePictureSizes()
      }

      AsyncFunction("record") { view: ExpoCameraView, options: RecordingOptions, promise: Promise ->
        if (!view.mute && !permissionsManager.hasGrantedPermissions(Manifest.permission.RECORD_AUDIO)) {
          throw Exceptions.MissingPermissions(Manifest.permission.RECORD_AUDIO)
        }

        view.record(options, promise, cacheDirectory)
      }.runOnQueue(Queues.MAIN)

      AsyncFunction("stopRecording") { view: ExpoCameraView ->
        view.activeRecording?.close()
      }.runOnQueue(Queues.MAIN)

      OnViewDestroys { view ->
        view.cancelCoroutineScope()
        view.releaseCamera()
      }
    }
  }

  private val cacheDirectory: File
    get() = appContext.cacheDirectory

  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()

  companion object {
    internal val TAG = CameraViewNextModule::class.java.simpleName
  }
}
