package expo.modules.camera

import android.Manifest
import android.content.Context
import android.os.Build

import com.google.android.cameraview.AspectRatio

import expo.modules.camera.tasks.ResolveTakenPictureAsyncTask
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.services.UIManager
import expo.modules.interfaces.permissions.Permissions

import java.lang.Exception

class CameraModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {

  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()
  private val permissionsManager: Permissions by moduleRegistry()
  private val uIManager: UIManager by moduleRegistry()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName() = TAG

  override fun getConstants() = mapOf(
    "Type" to typeConstants,
    "FlashMode" to flashModeConstants,
    "AutoFocus" to autoFocusConstants,
    "WhiteBalance" to whiteBalanceConstants,
    "VideoQuality" to videoQualityConstants,
    "FaceDetection" to emptyMap<String, Any>(),
  )

  @ExpoMethod
  fun pausePreview(viewTag: Int, promise: Promise) {
    addUIBlock(
      viewTag,
      object : UIManager.UIBlock<ExpoCameraView> {
        override fun resolve(view: ExpoCameraView) {
          try {
            if (view.isCameraOpened) {
              view.pausePreview()
            }
          } catch (e: Exception) {
            promise.reject(ERROR_TAG, "pausePreview -- exception occurred -- " + e.message, e)
          }
        }
        override fun reject(throwable: Throwable) = promise.reject(ERROR_TAG, throwable)
      }
    )
  }

  @ExpoMethod
  fun resumePreview(viewTag: Int, promise: Promise) {
    addUIBlock(
      viewTag,
      object : UIManager.UIBlock<ExpoCameraView> {
        override fun resolve(view: ExpoCameraView) {
          try {
            if (view.isCameraOpened) {
              view.resumePreview()
            }
          } catch (e: Exception) {
            promise.reject(ERROR_TAG, "resumePreview -- exception occurred -- " + e.message, e)
          }
        }
        override fun reject(throwable: Throwable) = promise.reject(ERROR_TAG, throwable)
      }
    )
  }

  @ExpoMethod
  fun takePicture(options: Map<String, Any>, viewTag: Int, promise: Promise) {
    val cacheDirectory = context.cacheDir
    addUIBlock(
      viewTag,
      object : UIManager.UIBlock<ExpoCameraView> {
        override fun resolve(view: ExpoCameraView) {
          if (!Build.FINGERPRINT.contains("generic")) {
            if (view.isCameraOpened) {
              view.takePicture(options, promise, cacheDirectory)
            } else {
              promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running")
            }
          } else {
            val image = CameraViewHelper.generateSimulatorPhoto(view.width, view.height)
            ResolveTakenPictureAsyncTask(image, promise, options, cacheDirectory, view).execute()
          }
        }
        override fun reject(throwable: Throwable) = promise.reject(ERROR_TAG, throwable)
      }
    )
  }

  @ExpoMethod
  fun record(options: Map<String?, Any?>, viewTag: Int, promise: Promise) {
    if (permissionsManager.hasGrantedPermissions(Manifest.permission.RECORD_AUDIO)) {
      val cacheDirectory = context.cacheDir
      addUIBlock(
        viewTag,
        object : UIManager.UIBlock<ExpoCameraView> {
          override fun resolve(view: ExpoCameraView) {
            if (view.isCameraOpened) {
              view.record(options, promise, cacheDirectory)
            } else {
              promise.reject("E_CAMERA_UNAVAILABLE", "Camera is not running")
            }
          }
          override fun reject(throwable: Throwable) = promise.reject(ERROR_TAG, throwable)
        }
      )
    } else {
      promise.reject(SecurityException("User rejected audio permissions"))
    }
  }

  @ExpoMethod
  fun stopRecording(viewTag: Int, promise: Promise) {
    addUIBlock(
      viewTag,
      object : UIManager.UIBlock<ExpoCameraView> {
        override fun resolve(view: ExpoCameraView) {
          if (view.isCameraOpened) {
            view.stopRecording()
            promise.resolve(true)
          } else {
            promise.reject(ERROR_TAG, "Camera is not open")
          }
        }
        override fun reject(throwable: Throwable) = promise.reject(ERROR_TAG, throwable)
      }
    )
  }

  @ExpoMethod
  fun getSupportedRatios(viewTag: Int, promise: Promise) {
    addUIBlock(
      viewTag,
      object : UIManager.UIBlock<ExpoCameraView> {
        override fun resolve(view: ExpoCameraView) {
          if (view.isCameraOpened) {
            promise.resolve(view.supportedAspectRatios.map { it.toString() })
          } else {
            promise.reject(ERROR_TAG, "Camera is not running")
          }
        }
        override fun reject(throwable: Throwable) = promise.reject(ERROR_TAG, throwable)
      }
    )
  }

  @ExpoMethod
  fun getAvailablePictureSizes(ratio: String?, viewTag: Int, promise: Promise) {
    addUIBlock(
      viewTag,
      object : UIManager.UIBlock<ExpoCameraView> {
        override fun resolve(view: ExpoCameraView) {
          if (view.isCameraOpened) {
            try {
              val sizes = view.getAvailablePictureSizes(AspectRatio.parse(ratio))
              promise.resolve(sizes.map { it.toString() })
            } catch (e: Exception) {
              promise.reject(ERROR_TAG, "getAvailablePictureSizes -- unexpected error -- " + e.message, e)
            }
          } else {
            promise.reject(ERROR_TAG, "Camera is not running")
          }
        }
        override fun reject(throwable: Throwable) = promise.reject(ERROR_TAG, throwable)
      }
    )
  }

  private fun addUIBlock(viewTag: Int, block: UIManager.UIBlock<ExpoCameraView>) {
    uIManager.addUIBlock(viewTag, block, ExpoCameraView::class.java)
  }

  @ExpoMethod
  fun requestPermissionsAsync(promise: Promise) {
    permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun requestCameraPermissionsAsync(promise: Promise) {
    permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun requestMicrophonePermissionsAsync(promise: Promise) {
    permissionsManager.askForPermissionsWithPromise(promise, Manifest.permission.RECORD_AUDIO)
  }

  @ExpoMethod
  fun getPermissionsAsync(promise: Promise) {
    permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun getCameraPermissionsAsync(promise: Promise) {
    permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.CAMERA)
  }

  @ExpoMethod
  fun getMicrophonePermissionsAsync(promise: Promise) {
    permissionsManager.getPermissionsWithPromise(promise, Manifest.permission.RECORD_AUDIO)
  }
}
