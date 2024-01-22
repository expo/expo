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

const val eventName = "onScreenshot"

class ScreenCaptureModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()
  private var screenCaptureCallback: Activity.ScreenCaptureCallback? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenCapture")

    Events(eventName)

    OnCreate {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback = Activity.ScreenCaptureCallback {
          sendEvent(eventName)
        }
        currentActivity.registerScreenCaptureCallback(currentActivity.mainExecutor, screenCaptureCallback!!)
      } else {
        ScreenshotEventEmitter(context) {
          sendEvent(eventName)
        }
      }
    }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_MEDIA_IMAGES)
      } else {
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_EXTERNAL_STORAGE)
      }
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_MEDIA_IMAGES)
      } else {
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.READ_EXTERNAL_STORAGE)
      }
    }

    AsyncFunction("preventScreenCapture") {
      currentActivity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("allowScreenCapture") {
      currentActivity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }.runOnQueue(Queues.MAIN)

    OnDestroy {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
        screenCaptureCallback?.let {
          currentActivity.unregisterScreenCaptureCallback(it)
        }
      }
    }
  }
}
