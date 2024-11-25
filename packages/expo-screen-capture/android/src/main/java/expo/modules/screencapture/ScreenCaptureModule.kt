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
import java.util.function.Consumer

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
  private var ScreenCaptureEventEmitter: ScreenCaptureEventEmitter? = null
  private var screenRecordingCallback: Consumer<Int>? = null
  private var isRegistered = false

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(screenshotEventName)
    Events(recordingEventName)

    OnCreate {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback = Activity.ScreenCaptureCallback {
          sendEvent(screenshotEventName)
        }
        registerScreenshotCallback()
      } else {
        ScreenCaptureEventEmitter = ScreenCaptureEventEmitter(context, {
          sendEvent(screenshotEventName)
        }, {
          sendEvent(recordingEventName, mapOf("isRecording" to true))
        })
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.VANILLA_ICE_CREAM) {
        screenRecordingCallback = Consumer { state ->
          if (state == WindowManager.SCREEN_RECORDING_STATE_VISIBLE) {
            sendEvent(recordingEventName, mapOf("isRecording" to true))
          } else {
            sendEvent(recordingEventName, mapOf("isRecording" to false))
          }
        }
        registerRecordingCallback()
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
      // Call register callbacks once more as a fallback if activity wasn't available in onCreate
      registerScreenshotCallback()
      registerRecordingCallback()
      ScreenCaptureEventEmitter?.onHostResume()
    }

    OnActivityEntersBackground {
      ScreenCaptureEventEmitter?.onHostPause()
    }

    OnDestroy {
      ScreenCaptureEventEmitter?.onHostDestroy()
      unregisterScreenshotCallback()
      unregisterRecordingCallback()
    }
  }

  private fun registerScreenshotCallback() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      safeCurrentActivity?.registerScreenCaptureCallback(currentActivity.mainExecutor, screenCaptureCallback!!)
    }
  }

  private fun unregisterScreenshotCallback() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      safeCurrentActivity?.unregisterScreenCaptureCallback(screenCaptureCallback!!)
    }
  }

  private fun registerRecordingCallback() {
    if (isRegistered || Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      return
    }
    val windowManager = currentActivity.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val initialState = windowManager.addScreenRecordingCallback(currentActivity.mainExecutor, screenRecordingCallback!!)
    screenRecordingCallback?.accept(initialState) // Process the initial state
    isRegistered = true
  }

  private fun unregisterRecordingCallback() {
    if (!isRegistered || Build.VERSION.SDK_INT < Build.VERSION_CODES.VANILLA_ICE_CREAM) {
      return
    }
    val windowManager = currentActivity.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    screenRecordingCallback?.let {
      windowManager.removeScreenRecordingCallback(it)
    }
    isRegistered = false
  }
}
