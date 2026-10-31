package expo.modules.screencapture

import android.Manifest
import android.app.Activity
import android.os.Build
import android.util.Log
import android.view.WindowManager
import com.facebook.react.bridge.LifecycleEventListener
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.exception.Exceptions
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.androidContext
import io.github.expo.modules.v2.react.currentActivity as reactCurrentActivity
import io.github.expo.modules.v2.react.reactContextOrNull
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

const val eventName = "onScreenshot"

val grantedPermissions = mapOf(
  "canAskAgain" to true,
  "granted" to true,
  "expires" to "never",
  "status" to "granted"
)

@ExpoModule("ExpoScreenCapture")
class ScreenCaptureModule : Module() {
  private val safeCurrentActivity
    get() = reactCurrentActivity
  private val currentActivity
    get() = safeCurrentActivity ?: throw Exceptions.MissingActivity()
  private var screenCaptureCallback: Activity.ScreenCaptureCallback? = null
  private var screenshotEventEmitter: ScreenshotEventEmitter? = null
  private var isRegistered = false

  @Event(name = eventName)
  private val onScreenshot = event<Map<String, Any?>>(
    onStartObserving = ::startObserving,
    onStopObserving = ::stopObserving
  )

  private val lifecycleListener = object : LifecycleEventListener {
    override fun onHostResume() {
      // Call registerCallback once more as a fallback if activity wasn't available when observing started
      registerCallback()
      screenshotEventEmitter?.onHostResume()
    }

    override fun onHostPause() {
      screenshotEventEmitter?.onHostPause()
    }

    override fun onHostDestroy() = Unit
  }

  private fun emitEvent() {
    try {
      onScreenshot(emptyMap())
    } catch (error: Throwable) {
      Log.e("ExpoScreenCapture", "Failed to emit event $eventName: ${error.message}")
    }
  }

  override fun onDestroy() {
    stopObserving()
  }

  @JS
  fun getPermissionsAsync(): Promise<Map<String, Any?>> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return Promise.resolve(grantedPermissions)
    }
    return legacyPermissionsPromise { promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Permissions.getPermissionsWithPermissionsManager(legacyPermissions, promise, Manifest.permission.READ_MEDIA_IMAGES)
      } else {
        Permissions.getPermissionsWithPermissionsManager(legacyPermissions, promise, Manifest.permission.READ_EXTERNAL_STORAGE)
      }
    }
  }

  @JS
  fun requestPermissionsAsync(): Promise<Map<String, Any?>> {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      return Promise.resolve(grantedPermissions)
    }
    return legacyPermissionsPromise { promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Permissions.askForPermissionsWithPermissionsManager(legacyPermissions, promise, Manifest.permission.READ_MEDIA_IMAGES)
      } else {
        Permissions.askForPermissionsWithPermissionsManager(legacyPermissions, promise, Manifest.permission.READ_EXTERNAL_STORAGE)
      }
    }
  }

  @JS
  suspend fun preventScreenCapture(): Unit = withContext(Dispatchers.Main) {
    currentActivity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  @JS
  suspend fun allowScreenCapture(): Unit = withContext(Dispatchers.Main) {
    currentActivity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
  }

  @Synchronized
  private fun startObserving() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      if (screenCaptureCallback == null) {
        screenCaptureCallback = Activity.ScreenCaptureCallback {
          emitEvent()
        }
      }
      // Let's try to register the callback
      registerCallback()
    } else if (screenshotEventEmitter == null) {
      screenshotEventEmitter = ScreenshotEventEmitter(androidContext) {
        emitEvent()
      }
    }
    reactContextOrNull?.addLifecycleEventListener(lifecycleListener)
  }

  @Synchronized
  private fun stopObserving() {
    reactContextOrNull?.removeLifecycleEventListener(lifecycleListener)
    screenshotEventEmitter?.onHostDestroy()
    screenshotEventEmitter = null
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      screenCaptureCallback?.let {
        safeCurrentActivity?.unregisterScreenCaptureCallback(it)
      }
    }
    isRegistered = false
  }

  @Synchronized
  private fun registerCallback() {
    if (isRegistered) {
      return
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
      val callback = screenCaptureCallback ?: return
      safeCurrentActivity?.registerScreenCaptureCallback(currentActivity.mainExecutor, callback) ?: return
      isRegistered = true
    }
  }
}
