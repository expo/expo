package expo.modules.screencapture

import android.Manifest
import android.app.Activity
import android.content.Context
import android.os.Build
import android.view.WindowManager
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val screenshotEventName = "onScreenshot"
const val recordingEventName = "onRecording"

val grantedPermissions = mapOf(
  "canAskAgain" to true,
  "granted" to true,
  "expires" to "never",
  "status" to "granted"
)

class ScreenCaptureModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()
  private val safeCurrentActivity
    get() = appContext.currentActivity
  private val currentActivity
    get() = safeCurrentActivity ?: throw Exceptions.MissingActivity()
  private var screenCaptureCallback: Activity.ScreenCaptureCallback? = null
  private var screenshotEventEmitter: ScreenshotEventEmitter? = null
  private var screenRecordingEventEmitter: ScreenRecordingEventEmitter? = null
  private var isRegistered = false

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(screenshotEventName, recordingEventName)

    OnCreate {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback = Activity.ScreenCaptureCallback {
          sendEvent(screenshotEventName)
        }
        // Let's try to register the callback
        registerCallback()
      } else {
        screenshotEventEmitter = ScreenshotEventEmitter(context) {
          sendEvent(screenshotEventName)
        }
      }

      // Add recording detection for Android 15+
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
        safeCurrentActivity?.let { activity ->
          screenRecordingEventEmitter = ScreenRecordingEventEmitter(activity) {
            sendEvent(recordingEventName)
          }
          screenRecordingEventEmitter?.register()
        }
      }
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        promise.resolve(grantedPermissions)
        return@AsyncFunction
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_MEDIA_IMAGES)
      } else {
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_EXTERNAL_STORAGE)
      }
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        promise.resolve(grantedPermissions)
        return@AsyncFunction
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_MEDIA_IMAGES)
      } else {
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_EXTERNAL_STORAGE)
      }
    }

    AsyncFunction<Unit>("preventScreenCapture") {
      currentActivity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction<Unit>("allowScreenCapture") {
      currentActivity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }.runOnQueue(Queues.MAIN)

    OnActivityEntersForeground {
      // Call registerCallback once more as a fallback if activity wasn't available in onCreate
      registerCallback()
      screenshotEventEmitter?.onHostResume()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
        screenRecordingEventEmitter?.register()
      }
    }

    OnActivityEntersBackground {
      screenshotEventEmitter?.onHostPause()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
        screenRecordingEventEmitter?.unregister()
      }
    }

    OnDestroy {
      screenshotEventEmitter?.onHostDestroy()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback?.let {
          safeCurrentActivity?.unregisterScreenCaptureCallback(it)
        }
      }
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
        screenRecordingEventEmitter?.unregister()
      }
    }
  }

  private fun registerCallback() {
    if (isRegistered) {
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      safeCurrentActivity?.registerScreenCaptureCallback(currentActivity.mainExecutor, screenCaptureCallback!!) ?: return
      isRegistered = true
    }
  }
}