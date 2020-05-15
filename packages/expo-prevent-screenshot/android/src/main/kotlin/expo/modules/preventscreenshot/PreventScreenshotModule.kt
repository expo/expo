package expo.modules.preventscreenshot

import android.app.Activity;
import android.content.Context
import android.view.WindowManager;

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.errors.CurrentActivityNotFoundException
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod
import org.unimodules.core.interfaces.ActivityProvider

class PreventScreenshotModule(context: Context) : ExportedModule(context) {

  private lateinit var activityProvider: ActivityProvider

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    activityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
  }

  @ExpoMethod
  fun activatePreventScreenshot(promise: Promise) {
    val activity = getCurrentActivity();

    activity.runOnUiThread{
      try {
        activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
        promise.resolve(null);
      } catch(exception: Exception) {
        promise.reject("ERROR", "Failed to prevent screen capture." + exception);
      }
    }
  }

  @ExpoMethod
  fun deactivatePreventScreenshot(promise: Promise) {
    val activity = getCurrentActivity();
    
    activity.runOnUiThread{
      try {
        activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
        promise.resolve(null);
      } catch(exception: Exception) {
        promise.reject("ERROR", "Failed to reallow screen capture." + exception);
      }
    }
  }

  @Throws(IllegalStateException::class)
  fun getCurrentActivity(): Activity {
    val activity = activityProvider.currentActivity
    if (activity != null) {
      return activity;
    } else {
      throw IllegalStateException("No activity found.");
    }
  }

  companion object {
    private val NAME = "ExpoPreventScreenshot"
    private val TAG = PreventScreenshotModule::class.qualifiedName
  }
}
