package expo.modules.camera

import android.Manifest
import android.graphics.Bitmap
import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.util.Log
import com.google.mlkit.vision.codescanner.GmsBarcodeScannerOptions
import com.google.mlkit.vision.codescanner.GmsBarcodeScanning
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
import expo.modules.camera.tasks.writeStreamToFile
import expo.modules.core.errors.ModuleDestroyedException
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import java.io.ByteArrayOutputStream
import java.io.File

val cameraEvents = arrayOf(
  "onCameraReady",
  "onMountError",
  "onBarcodeScanned",
  "onFacesDetected",
  "onFaceDetectionError",
  "onPictureSaved",
  "onAvailableLensesChanged"
)

class CameraViewModule : Module() {
  private val moduleScope = CoroutineScope(Dispatchers.Main)

  override fun definition() = ModuleDefinition {
    Name("ExpoCamera")

    Events("onModernBarcodeScanned")

    // Aligned with iOS which has the same property. Will always be true on Android since
    // the Google code scanner's min sdk is 21 - and our min sdk is currently 24.
    Property("isModernBarcodeScannerAvailable") {
      true
    }

    // Again, aligned with iOS.
    Property("toggleRecordingAsyncAvailable") {
      true
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

    AsyncFunction("launchScanner") { settings: BarcodeSettings ->
      val reactContext = appContext.reactContext
        ?: throw Exceptions.ReactContextLost()
      val options = GmsBarcodeScannerOptions.Builder()
        .setBarcodeFormats(
          settings.barcodeTypes.first().mapToBarcode(),
          *settings.barcodeTypes.drop(1).map { it.mapToBarcode() }.toIntArray()
        )
        .build()

      val scanner = GmsBarcodeScanning.getClient(reactContext, options)
      scanner.startScan()
        .addOnSuccessListener { barcode ->
          val result = BarCodeScannerResultSerializer.parseBarcodeScanningResult(barcode)
          sendEvent("onModernBarcodeScanned", BarCodeScannerResultSerializer.toBundle(result, 1.0f))
        }
        .addOnFailureListener {
          throw CameraExceptions.BarcodeScanningFailedException()
        }
    }

    OnDestroy {
      try {
        moduleScope.cancel(ModuleDestroyedException())
      } catch (_: IllegalStateException) {
        Log.e(TAG, "The scope does not have a job in it")
      }
    }

    Class("Picture", PictureRef::class) {
      Property("width") { picture: PictureRef ->
        picture.ref.width
      }

      Property("height") { picture: PictureRef ->
        picture.ref.height
      }

      AsyncFunction("savePictureAsync") { picture: PictureRef, options: SavePictureOptions?, promise: Promise ->
        val image = picture.ref
        val response = Bundle()

        cacheDirectory.let {
          response.apply {
            putInt("width", image.width)
            putInt("height", image.height)
          }

          val quality = options?.quality ?: 1
          // Cache compressed image in imageStream
          ByteArrayOutputStream().use { imageStream ->
            image.compress(Bitmap.CompressFormat.JPEG, quality.toInt() * 100, imageStream)
            // Write compressed image to file in cache directory
            try {
              val filePath = writeStreamToFile(it, imageStream)
              image.recycle()
              val imageFile = File(filePath)
              val fileUri = Uri.fromFile(imageFile).toString()
              response.putString("uri", fileUri)

              // Write base64-encoded image to the response if requested
              if (options?.base64 == true) {
                response.putString("base64", Base64.encodeToString(imageStream.toByteArray(), Base64.NO_WRAP))
              }
              promise.resolve(response)
            } catch (e: CodedException) {
              promise.reject(e)
            }
          }
        }
      }
    }

    View(ExpoCameraView::class) {
      Events(cameraEvents)

      Prop("facing") { view, facing: CameraType? ->
        facing?.let {
          if (view.lensFacing != it) {
            view.lensFacing = it
          }
        } ?: run {
          if (view.lensFacing != CameraType.BACK) {
            view.lensFacing = CameraType.BACK
          }
        }
      }

      Prop("flashMode") { view, flashMode: FlashMode? ->
        flashMode?.let {
          if (view.flashMode != it) {
            view.flashMode = it
          }
        } ?: run {
          if (view.flashMode != FlashMode.OFF) {
            view.flashMode = FlashMode.OFF
          }
        }
      }

      Prop("enableTorch") { view, enabled: Boolean? ->
        enabled?.let {
          if (view.enableTorch != it) {
            view.enableTorch = it
          }
        } ?: run {
          if (view.enableTorch) {
            view.enableTorch = false
          }
        }
      }

      Prop("animateShutter") { view, animate: Boolean? ->
        view.animateShutter = animate ?: true
      }

      Prop("zoom") { view, zoom: Float? ->
        zoom?.let {
          if (view.zoom != it) {
            view.zoom = it
          }
        } ?: run {
          if (view.zoom != 0f) {
            view.zoom = 0f
          }
        }
      }

      Prop("mode") { view, mode: CameraMode? ->
        mode?.let {
          if (view.cameraMode != it) {
            view.cameraMode = it
          }
        } ?: run {
          if (view.cameraMode != CameraMode.PICTURE) {
            view.cameraMode = CameraMode.PICTURE
          }
        }
      }

      Prop("mute") { view, muted: Boolean? ->
        view.mute = muted ?: false
      }

      Prop("videoQuality") { view, quality: VideoQuality? ->
        quality?.let {
          if (view.videoQuality != it) {
            view.videoQuality = it
          }
        } ?: run {
          if (view.videoQuality != VideoQuality.VIDEO1080P) {
            view.videoQuality = VideoQuality.VIDEO1080P
          }
        }
      }

      Prop("barcodeScannerSettings") { view, settings: BarcodeSettings? ->
        settings?.let {
          view.setBarcodeScannerSettings(it)
        }
      }

      Prop("barcodeScannerEnabled") { view, enabled: Boolean? ->
        enabled?.let {
          view.setShouldScanBarcodes(enabled)
        }
      }

      Prop("pictureSize") { view, pictureSize: String? ->
        pictureSize?.let {
          if (view.pictureSize != it) {
            view.pictureSize = it
          }
        } ?: run {
          if (view.pictureSize.isNotEmpty()) {
            view.pictureSize = ""
          }
        }
      }

      Prop("autoFocus") { view, autoFocus: FocusMode? ->
        autoFocus?.let {
          if (view.autoFocus != it) {
            view.autoFocus = it
          }
        } ?: run {
          if (view.autoFocus != FocusMode.OFF) {
            view.autoFocus = FocusMode.OFF
          }
        }
      }

      Prop("ratio") { view, ratio: CameraRatio? ->
        ratio?.let {
          if (view.ratio != it) {
            view.ratio = it
          }
        } ?: run {
          if (view.ratio != null) {
            view.ratio = null
          }
        }
      }

      Prop("mirror") { view, mirror: Boolean? ->
        mirror?.let {
          if (view.mirror != it) {
            view.mirror = it
          }
        } ?: run {
          if (view.mirror) {
            view.mirror = false
          }
        }
      }

      Prop("videoBitrate") { view, bitrate: Int? ->
        bitrate?.let {
          if (view.videoEncodingBitrate != it) {
            view.videoEncodingBitrate = it
          }
        } ?: run {
          if (view.videoEncodingBitrate != null) {
            view.videoEncodingBitrate = null
          }
        }
      }

      OnViewDidUpdateProps { view ->
        moduleScope.launch {
          view.createCamera()
        }
      }

      AsyncFunction("takePicture") { view: ExpoCameraView, options: PictureOptions, promise: Promise ->
        if (!EmulatorUtilities.isRunningOnEmulator()) {
          view.takePicture(options, promise, cacheDirectory, runtimeContext)
        } else {
          val image = CameraViewHelper.generateSimulatorPhoto(view.width, view.height)
          moduleScope.launch {
            ResolveTakenPicture(image, promise, options, false, runtimeContext, cacheDirectory) { response ->
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

      AsyncFunction("toggleRecording") { view: ExpoCameraView ->
        view.toggleRecording()
      }

      AsyncFunction("stopRecording") { view: ExpoCameraView ->
        view.stopRecording()
      }.runOnQueue(Queues.MAIN)

      AsyncFunction("resumePreview") { view: ExpoCameraView ->
        view.resumePreview()
      }

      AsyncFunction("pausePreview") { view: ExpoCameraView ->
        view.pausePreview()
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
