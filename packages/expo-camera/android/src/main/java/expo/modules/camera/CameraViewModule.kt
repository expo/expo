package expo.modules.camera

import android.Manifest
import android.graphics.Bitmap
import android.util.Log
import expo.modules.camera.analyzers.BarCodeScannerResultSerializer
import expo.modules.camera.analyzers.MLKitBarCodeScanner
import expo.modules.camera.records.BarcodeSettings
import expo.modules.camera.records.BarcodeType
import expo.modules.camera.records.CameraMode
import expo.modules.camera.records.CameraRatio
import expo.modules.camera.records.CameraType
import expo.modules.camera.records.FlashMode
import expo.modules.camera.records.FocusMode
import expo.modules.camera.records.VideoQuality
import expo.modules.camera.tasks.ResolveTakenPicture
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.interfaces.imageloader.ImageLoaderInterface
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

class CameraViewModule : Module() {
  private val moduleScope = CoroutineScope(Dispatchers.Main)

  override fun definition() = ModuleDefinition {
    Name("ExpoCamera")

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

    AsyncFunction("scanFromURLAsync") { url: String, barcodeTypes: List<BarcodeType>, promise: Promise ->
      appContext.imageLoader?.loadImageForManipulationFromURL(
        url,
        object : ImageLoaderInterface.ResultListener {
          override fun onSuccess(bitmap: Bitmap) {
            val scanner = MLKitBarCodeScanner()
            val formats = barcodeTypes.map { it.mapToBarcode() }
            scanner.setSettings(formats)

            moduleScope.launch {
              val barcodes = scanner.scan(bitmap)
                .filter { formats.contains(it.type) }
                .map { BarCodeScannerResultSerializer.toBundle(it, 1.0f) }
              promise.resolve(barcodes)
            }
          }

          override fun onFailure(cause: Throwable?) {
            promise.reject(CameraExceptions.ImageRetrievalException(url))
          }
        }
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
          if (view.lensFacing != facing) {
            view.lensFacing = it
          }
        }
      }

      Prop("flashMode") { view, flashMode: FlashMode? ->
        flashMode?.let {
          view.setCameraFlashMode(it)
        }
      }

      Prop("enableTorch") { view, enabled: Boolean? ->
        view.enableTorch = enabled ?: false
      }

      Prop("animateShutter") { view, animate: Boolean? ->
        view.animateShutter = animate ?: true
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

      Prop("autoFocus") { view, autoFocus: FocusMode? ->
        view.autoFocus = autoFocus ?: FocusMode.OFF
      }

      Prop("ratio") { view, ratio: CameraRatio? ->
        if (view.ratio != ratio) {
          view.ratio = ratio
        }
      }

      Prop("mirror") { view, mirror: Boolean? ->
        mirror?.let {
          view.mirror = it
          return@Prop
        }
        view.mirror = false
      }

      OnViewDidUpdateProps { view ->
        view.createCamera()
      }

      AsyncFunction("takePicture") { view: ExpoCameraView, options: PictureOptions, promise: Promise ->
        if (!EmulatorUtilities.isRunningOnEmulator()) {
          view.takePicture(options, promise, cacheDirectory)
        } else {
          val image = CameraViewHelper.generateSimulatorPhoto(view.width, view.height)
          moduleScope.launch {
            ResolveTakenPicture(image, promise, options, false, cacheDirectory) { response ->
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

      AsyncFunction("resumePreview") { view: ExpoCameraView ->
        view.resumePreview()
      }

      AsyncFunction("pausePreview") { view: ExpoCameraView ->
        view.pausePreview()
      }

      OnViewDestroys { view ->
        view.orientationEventListener.disable()
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
    internal val TAG = CameraViewModule::class.java.simpleName
  }
}
