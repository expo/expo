package expo.modules.splashscreen

import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

// Below import must be kept unversioned even in versioned code to provide a redirection from
// versioned code realm to unversioned code realm.
// Without this import any `SplashScreen.anyMethodName(...)` invocation on JS side ends up
// in versioned SplashScreen kotlin object that stores no information about the ExperienceActivity.

class HideSplashScreenOptions : Record {
  @Field
  val duration: Float = 200.0F
}

class ModuleOptions : Record {
    val delay: Float? = 3000.0F
}

class SplashScreenModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExpoSplashScreen")

    OnCreate {
      SplashScreenManager.reportWarningToLogBox = { message: String ->
        appContext.errorManager?.reportWarningToLogBox(message)
      }
    }

    AsyncFunction("hideAsync") { options: HideSplashScreenOptions, promise: Promise ->
      SplashScreenManager.hide(options, appContext.currentActivity)
    }
  }
}
