package abi49_0_0.expo.modules.splashscreen

import abi49_0_0.expo.modules.kotlin.Promise
import abi49_0_0.expo.modules.kotlin.exception.Exceptions
import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition
import abi49_0_0.expo.modules.splashscreen.exceptions.HideAsyncException
import abi49_0_0.expo.modules.splashscreen.exceptions.PreventAutoHideException

// Below import must be kept unversioned even in versioned code to provide a redirection from
// versioned code realm to unversioned code realm.
// Without this import any `SplashScreen.anyMethodName(...)` invocation on JS side ends up
// in versioned SplashScreen kotlin object that stores no information about the ExperienceActivity.
import expo.modules.splashscreen.singletons.SplashScreen

class SplashScreenModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoSplashScreen")

    AsyncFunction("preventAutoHideAsync") { promise: Promise ->
      val currentActivity =
        appContext.currentActivity ?: throw Exceptions.MissingActivity()

      SplashScreen.preventAutoHide(
        currentActivity,
        { hasEffect -> promise.resolve(hasEffect) },
        { m -> promise.reject(PreventAutoHideException(m)) }
      )
    }

    AsyncFunction("hideAsync") { promise: Promise ->
      val currentActivity =
        appContext.currentActivity ?: throw Exceptions.MissingActivity()

      SplashScreen.hide(
        currentActivity,
        { hasEffect -> promise.resolve(hasEffect) },
        { m -> promise.reject(HideAsyncException(m)) }
      )
    }
  }
}
