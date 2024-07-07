package expo.modules.splashscreen

import expo.modules.kotlin.functions.Queues
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
  val fade: Boolean = false
  @Field
  val duration: Long = 2000L
}

class SplashScreenModule : Module() {

  override fun definition() = ModuleDefinition {
    Name("ExpoSplashScreen")

    AsyncFunction("hideAsync") { options: HideSplashScreenOptions? ->
      SplashScreenManager.hide(options)
    }.runOnQueue(Queues.MAIN)

    OnActivityDestroys {
      SplashScreenManager.clear()
    }
  }
}
