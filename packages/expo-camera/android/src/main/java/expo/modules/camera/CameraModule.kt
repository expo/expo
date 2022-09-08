package expo.modules.camera

import android.Manifest
import android.content.Context
import com.google.android.cameraview.AspectRatio
import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask
import expo.modules.core.utilities.EmulatorUtilities
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class CameraModule : Module() {
  override fun definition() = ModuleDefinition {
    // TODO(@lukmccall): combine with the `CameraViewManager` and rename to `ExponentCamera`
    Name("ExponentCameraModule")
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
      ),
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
      val cacheDirectory = reactContext.cacheDir
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
      if (!permissionsManager.hasGrantedPermissions(Manifest.permission.RECORD_AUDIO)) {
        throw Exceptions.MissingPermissions(Manifest.permission.RECORD_AUDIO)
      }

      val cacheDirectory = reactContext.cacheDir
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

    AsyncFunction("getAvailablePictureSizes") { ratio: String?, viewTag: Int ->
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
  }

  private val reactContext: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  private val permissionsManager: Permissions
    get() = appContext.permissions ?: throw Exceptions.PermissionsModuleNotFound()

  private fun findView(viewTag: Int): ExpoCameraView {
    return appContext.findView(viewTag)
      ?: throw Exceptions.ViewNotFound(ExpoCameraView::class, viewTag)
  }
}
