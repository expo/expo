package expo.modules.splashscreen

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.launch

class SplashScreenOptions : Record {
  @Field
  val duration: Long = 400L

  @Field
  var fade: Boolean = true
}

class SplashScreenModule : Module() {
  private var userControlledAutoHideEnabled: Boolean = false

  override fun definition() = ModuleDefinition {
    Name("ExpoSplashScreen")

    AsyncFunction<Unit>("preventAutoHideAsync") {
      // The user has manually invoked prevent autohide, this is used to allow libraries
      // such as expo-router to know whether it's safe to hide or if they should wait for
      // the user to do it.
      userControlledAutoHideEnabled = true
      SplashScreenManager.preventAutoHideCalled = true
    }

    AsyncFunction<Unit>("internalPreventAutoHideAsync") {
      SplashScreenManager.preventAutoHideCalled = true
    }

    Function("setOptions") { options: SplashScreenOptions ->
      // Needs to run on the main thread on apis below 33
      appContext.mainQueue.launch {
        SplashScreenManager.setSplashScreenOptions(options)
      }
    }

    Function("hide") {
      SplashScreenManager.hide()
    }

    // For backwards compatibility
    AsyncFunction("hideAsync") {
      SplashScreenManager.hide()
    }

    AsyncFunction("internalMaybeHideAsync") {
      if (!userControlledAutoHideEnabled) {
        SplashScreenManager.hide()
      }
    }

    OnDestroy {
      SplashScreenManager.unregisterContentAppearedListener()
    }
  }
}
