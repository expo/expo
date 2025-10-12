package expo.modules.screencapture

import android.Manifest
import android.app.Activity
import android.content.Context
import android.os.Build
import android.util.Log
import android.view.WindowManager
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

const val eventName = "onScreenshot"

val grantedPermissions = mapOf(
  "canAskAgain" to true,
  "granted" to true,
  "expires" to "never",
  "status" to "granted"
)

val deniedPermissions = mapOf(
  "canAskAgain" to false,
  "granted" to false,
  "expires" to "never",
  "status" to "denied"
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
  private var isRegistered = false

  private fun emitEvent() {
    try {
      sendEvent(eventName)
    } catch (error: Throwable) {
      Log.e("ExpoScreenCapture", "Failed to emit event $eventName: ${error.message}")
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(eventName)

    OnCreate {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback = Activity.ScreenCaptureCallback {
          emitEvent()
        }
        // Let's try to register the callback
        registerCallback()
      } else {
        screenshotEventEmitter = ScreenshotEventEmitter(context) {
          emitEvent()
        }
      }
    }

    AsyncFunction("getPermissionsAsync") { useLegacyPermissions: Boolean?, promise: Promise ->
      val useLegacy = useLegacyPermissions ?: false
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        // Android 14+ has DETECT_SCREEN_CAPTURE
        promise.resolve(grantedPermissions)
        return@AsyncFunction
      }
      
      if (!useLegacy) {
        // Android 13 and below - screenshot detection disabled
        promise.resolve(deniedPermissions)
        return@AsyncFunction
      }
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        // Android 13 requires READ_MEDIA_IMAGES for screenshot detection
        requestPermissionSafely(promise, Manifest.permission.READ_MEDIA_IMAGES, false)
        return@AsyncFunction
      } else {
        // Android 12 and below - requires READ_EXTERNAL_STORAGE for screenshot detection
        requestPermissionSafely(promise, Manifest.permission.READ_EXTERNAL_STORAGE, false)
        return@AsyncFunction
      }
    }

    AsyncFunction("requestPermissionsAsync") { useLegacyPermissions: Boolean?, promise: Promise ->
      val useLegacy = useLegacyPermissions ?: false
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        // Android 14+ has DETECT_SCREEN_CAPTURE
        promise.resolve(grantedPermissions)
        return@AsyncFunction
      }
      
      if (!useLegacy) {
        // Android 13 and below - screenshot detection disabled
        promise.resolve(deniedPermissions)
        return@AsyncFunction
      }
      
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        // Android 13 requires READ_MEDIA_IMAGES for screenshot detection
        requestPermissionSafely(promise, Manifest.permission.READ_MEDIA_IMAGES, true)
        return@AsyncFunction
      } else {
        // Android 12 and below - requires READ_EXTERNAL_STORAGE for screenshot detection
        requestPermissionSafely(promise, Manifest.permission.READ_EXTERNAL_STORAGE, true)
        return@AsyncFunction
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
    }

    OnActivityEntersBackground {
      screenshotEventEmitter?.onHostPause()
    }

    OnDestroy {
      screenshotEventEmitter?.onHostDestroy()
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback?.let {
          safeCurrentActivity?.unregisterScreenCaptureCallback(it)
        }
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

  private fun requestPermissionSafely(promise: Promise, permission: String, isRequest: Boolean) {
    try {
      if (isRequest) {
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, permission)
      } else {
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, permission)
      }
    } catch (e: Exception) {
      val action = if (isRequest) "request" else "check"
      Log.e("ExpoScreenCapture", "Failed to $action permission: $permission", e)
      promise.resolve(deniedPermissions)
    }
  }

}
