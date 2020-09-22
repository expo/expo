package abi39_0_0.expo.modules.splashscreen

import android.content.Context

import abi39_0_0.org.unimodules.core.ExportedModule
import abi39_0_0.org.unimodules.core.ModuleRegistry
import abi39_0_0.org.unimodules.core.Promise
import abi39_0_0.org.unimodules.core.errors.CurrentActivityNotFoundException
import abi39_0_0.org.unimodules.core.interfaces.ActivityProvider
import abi39_0_0.org.unimodules.core.interfaces.ExpoMethod

// Below import is added explicitly to provide a redirection from versioned code realm to unversioned code realm.
// Without this import any `SplashScreen.methodName(...)` invocation on JS side ends up in versioned SplashScreen kotlin object that stores no state about the ExperienceActivity.
// Other solution would be:
// - create package with the SplashScreenSingletonModule interface and publish as a separate package (that would add complexity into `expo-splash-screen` package itself)
// - register unversioned SplashScreen object as a singleton module in ModuleRegistry
// - use ModuleRegistry.getSingletonModule("SplashScreenSingletonModuleName", SplashScreenInterface.class); (that would add complexity into `expo-splash-screen` package itself)
// TODO (@bbarthec): add this import while performing Android versioning
import expo.modules.splashscreen.SplashScreen

class SplashScreenModule(context: Context) : ExportedModule(context) {
  companion object {
    private const val NAME = "ExpoSplashScreen"
    private const val ERROR_TAG = "ERR_SPLASH_SCREEN"
  }

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
      promise.reject(CurrentActivityNotFoundException())
      return
    }
    SplashScreen.preventAutoHide(
      activity,
      { hasEffect -> promise.resolve(hasEffect) },
      { m -> promise.reject(ERROR_TAG, m) }
    )
  }

  @ExpoMethod
  fun hideAsync(promise: Promise) {
    val activity = activityProvider.currentActivity
    if (activity == null) {
      promise.reject(CurrentActivityNotFoundException())
      return
    }
    SplashScreen.hide(
      activity,
      { hasEffect -> promise.resolve(hasEffect) },
      { m -> promise.reject(ERROR_TAG, m) }
    )
  }
}
