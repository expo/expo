package expo.modules.screencapture

import android.Manifest
import android.app.Activity
import android.content.Context
import android.os.Build
import android.view.WindowManager
import android.window.WindowManager
import android.window.WindowManager.SCREEN_RECORDING_STATE_VISIBLE
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val onScreenshotEventName = "onScreenshot"
const val onScreenRecordingEventName = "onScreenRecording"

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
  private var screenRecordingCallback: Activity.ScreenRecordingCallback? = null
  private var screenshotEventEmitter: ScreenshotEventEmitter? = null
  private var isScreenshotCallbackRegistered = false
  private var isRecordingCallbackRegistered = false

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(onScreenshotEventName, onScreenRecordingEventName)

    OnCreate {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback = Activity.ScreenCaptureCallback {
          sendEvent(onScreenshotEventName)
        }

        screenRecordingCallback = Activity.ScreenRecordingCallback { state ->
          sendEvent(onScreenRecordingEventName, mapOf(
            "isCaptured" to (state == SCREEN_RECORDING_STATE_VISIBLE)
          ))
        }
        // Let's try to register the callback
        registerScreenshotCallback()
        registerRecordingCallback()
      } else {
        screenshotEventEmitter = ScreenshotEventEmitter(context) {
          sendEvent(onScreenshotEventName)
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
      registerScreenshotCallback()
      registerRecordingCallback()
      screenshotEventEmitter?.onHostResume()
    }

    OnActivityEntersBackground {
      screenshotEventEmitter?.onHostPause()
    }

    OnDestroy {
      screenshotEventEmitter?.onHostDestroy()
      unregisterScreenshotCallback()
      unregisterRecordingCallback()
    }
  }

  private fun registerScreenshotCallback() {
    if (isScreenshotCallbackRegistered) {
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      safeCurrentActivity?.registerScreenCaptureCallback(currentActivity.mainExecutor, screenCaptureCallback!!) ?: return
      isScreenshotCallbackRegistered = true
    }
  }

  private fun unregisterScreenshotCallback() {
    if (!isScreenshotCallbackRegistered || Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return
    }
    safeCurrentActivity?.unregisterScreenCaptureCallback(screenCaptureCallback!!)
    isScreenshotCallbackRegistered = false
  }

  private fun registerRecordingCallback() {
    if (isRecordingCallbackRegistered || Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      return
    }
    
    safeCurrentActivity?.windowManager?.addScreenRecordingCallback(
      currentActivity.mainExecutor,
      screenRecordingCallback!!
    )
    isRecordingCallbackRegistered = true
  }

  private fun unregisterRecordingCallback() {
    if (!isRecordingCallbackRegistered || Build.VERSION.SDK_INT < Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return
    }

    safeCurrentActivity?.windowManager?.removeScreenRecordingCallback(screenRecordingCallback!!)
    isRecordingCallbackRegistered = false
  }
}
