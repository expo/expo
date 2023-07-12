package expo.modules.screencapture

import android.content.Context
import android.view.WindowManager
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ScreenCaptureModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()
  private val currentActivity
    get() = appContext.currentActivity ?: throw Exceptions.MissingActivity()

  override fun definition() = ModuleDefinition {
    Name("ExpoScreenCapture")

    OnCreate {
      ScreenshotEventEmitter(context, appContext.legacyModuleRegistry)
    }

    AsyncFunction("preventScreenCapture") {
      currentActivity.window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }.runOnQueue(Queues.MAIN)

    AsyncFunction("allowScreenCapture") {
      currentActivity.window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }.runOnQueue(Queues.MAIN)
  }
}
