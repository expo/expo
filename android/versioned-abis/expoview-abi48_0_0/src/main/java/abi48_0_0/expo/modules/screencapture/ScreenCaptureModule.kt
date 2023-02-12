package abi48_0_0.expo.modules.screencapture

import android.app.Activity
import android.content.Context
import android.view.WindowManager

import abi48_0_0.expo.modules.core.ExportedModule
import abi48_0_0.expo.modules.core.ModuleRegistry
import abi48_0_0.expo.modules.core.Promise
import abi48_0_0.expo.modules.core.errors.CurrentActivityNotFoundException
import abi48_0_0.expo.modules.core.interfaces.ActivityProvider
import abi48_0_0.expo.modules.core.interfaces.ExpoMethod

class ScreenCaptureModule(context: Context) : ExportedModule(context) {

  private lateinit var mActivityProvider: ActivityProvider

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    mActivityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
    ScreenshotEventEmitter(context, moduleRegistry)
  }

  @ExpoMethod
  fun preventScreenCapture(promise: Promise) {
    val activity = getCurrentActivity()

    activity.runOnUiThread {
      try {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE)
      } catch (exception: Exception) {
        promise.reject(ERROR_CODE_PREVENTION, "Failed to prevent screen capture: " + exception)
      }
    }
    promise.resolve(null)
  }

  @ExpoMethod
  fun allowScreenCapture(promise: Promise) {
    val activity = getCurrentActivity()

    activity.runOnUiThread {
      try {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
      } catch (exception: Exception) {
        promise.reject(ERROR_CODE_PREVENTION, "Failed to reallow screen capture: " + exception)
      }
    }
    promise.resolve(null)
  }

  @Throws(CurrentActivityNotFoundException::class)
  fun getCurrentActivity(): Activity {
    val activity = mActivityProvider.currentActivity
    if (activity != null) {
      return activity
    } else {
      throw CurrentActivityNotFoundException()
    }
  }

  companion object {
    private val NAME = "ExpoScreenCapture"
    private const val ERROR_CODE_PREVENTION = "ERR_SCREEN_CAPTURE_PREVENTION"
  }
}
