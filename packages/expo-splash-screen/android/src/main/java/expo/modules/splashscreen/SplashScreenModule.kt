package expo.modules.splashscreen

import android.content.Context

import org.unimodules.core.ExportedModule
import org.unimodules.core.ModuleRegistry
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ActivityProvider
import org.unimodules.core.interfaces.ExpoMethod

private const val NAME = "ExpoSplashScreen"
private const val ERROR_TAG = "ERR_SPLASH"

class SplashScreenModule(context: Context) : ExportedModule(context) {
  private lateinit var activityProvider: ActivityProvider

  override fun getName(): String {
    return NAME
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    activityProvider = moduleRegistry.getModule(ActivityProvider::class.java)
  }

  @ExpoMethod
  fun preventAutoHideAsync(promise: Promise) {
    val activity = activityProvider.currentActivity
    if (activity == null) {
      promise.reject(ERROR_TAG, "No valid activity.")
      return
    }
    SplashScreen.preventAutoHide(
      activity,
      { promise.resolve(null) },
      { m -> promise.reject(ERROR_TAG, m) }
    )
  }

  @ExpoMethod
  fun hideAsync(promise: Promise) {
    val activity = activityProvider.currentActivity
    if (activity == null) {
      promise.reject(ERROR_TAG, "No valid activity.")
      return
    }
    SplashScreen.hide(
      activity,
      { promise.resolve(null) },
      { m -> promise.reject(ERROR_TAG, m) }
    )
  }
}
