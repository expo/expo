package expo.modules.camera.legacy

import android.Manifest
import com.google.android.cameraview.AspectRatio
import com.google.android.cameraview.Size
import expo.modules.camera.legacy.tasks.ResolveTakenPictureAsyncTask
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

class CameraViewLegacyModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoCameraLegacy")

    Constants(
      "Type" to mapOf(
        "front" to com.google.android.cameraview.Constants.FACING_FRONT,
        "back" to com.google.android.cameraview.Constants.FACING_BACK
      ),
      "FlashMode" to mapOf(
        "off" to com.google.android.cameraview.Constants.FLASH_OFF,
        "on" to com.google.android.cameraview.Constants.FLASH_ON,
        "auto" to com.google.android.cameraview.Constants.FLASH_AUTO,
        "torch" to com.google.android.cameraview.Constants.FLASH_TORCH
      ),
      "AutoFocus" to mapOf(
        "on" to true,
        "off" to false
      ),
      "WhiteBalance" to mapOf(
        "auto" to com.google.android.cameraview.Constants.WB_AUTO,
        "cloudy" to com.google.android.cameraview.Constants.WB_CLOUDY,
        "sunny" to com.google.android.cameraview.Constants.WB_SUNNY,
        "shadow" to com.google.android.cameraview.Constants.WB_SHADOW,
        "fluorescent" to com.google.android.cameraview.Constants.WB_FLUORESCENT,
        "incandescent" to com.google.android.cameraview.Constants.WB_INCANDESCENT
      ),
      "VideoQuality" to mapOf(
        "2160p" to VIDEO_2160P,
        "1080p" to VIDEO_1080P,
        "720p" to VIDEO_720P,
        "480p" to VIDEO_480P,
        "4:3" to VIDEO_4x3
      )
    )

    AsyncFunction("pausePreview") { viewTag: Int ->
      val view = findView(viewTag)

      if (view.cameraView.isCameraOpened) {
        view.cameraView.pausePreview()
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("resumePreview") { viewTag: Int ->
      val view = findView(viewTag)

      if (view.cameraView.isCameraOpened) {
        view.cameraView.resumePreview()
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("takePicture") { options: PictureOptions, viewTag: Int, promise: Promise ->
      val view = findView(viewTag)

      if (!EmulatorUtilities.isRunningOnEmulator()) {
        if (!view.cameraView.isCameraOpened) {
          throw CameraExceptions.CameraIsNotRunning()
        }

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

      if (!view.cameraView.isCameraOpened) {
        throw CameraExceptions.CameraIsNotRunning()
      }

      view.record(options, promise, cacheDirectory)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("stopRecording") { viewTag: Int ->
      val view = findView(viewTag)

      if (view.cameraView.isCameraOpened) {
        view.cameraView.stopRecording()
      }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getSupportedRatios") { viewTag: Int ->
      val view = findView(viewTag)

      if (!view.cameraView.isCameraOpened) {
        throw CameraExceptions.CameraIsNotRunning()
      }

      return@AsyncFunction view.cameraView.supportedAspectRatios.map { it.toString() }
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("getAvailablePictureSizes") { ratio: String, viewTag: Int ->
      val view = findView(viewTag)

      if (!view.cameraView.isCameraOpened) {
        throw CameraExceptions.CameraIsNotRunning()
      }

      val sizes = view.cameraView.getAvailablePictureSizes(AspectRatio.parse(ratio))
      return@AsyncFunction sizes.map { it.toString() }
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
        if (settings == null) {
          return@Prop
        }
        view.setBarCodeScannerSettings(BarCodeScannerSettings(settings))
      }

      Prop("useCamera2Api") { view: ExpoCameraView, useCamera2Api: Boolean ->
        view.cameraView.setUsingCamera2Api(useCamera2Api)
      }

      Prop("barCodeScannerEnabled") { view: ExpoCameraView, barCodeScannerEnabled: Boolean? ->
        view.setShouldScanBarCodes(barCodeScannerEnabled ?: false)
      }

      Prop("faceDetectorEnabled") { view: ExpoCameraView, faceDetectorEnabled: Boolean? ->
        view.setShouldDetectFaces(faceDetectorEnabled ?: false)
      }

      Prop("faceDetectorSettings") { view: ExpoCameraView, settings: Map<String, Any>? ->
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
