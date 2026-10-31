package expo.modules.splashscreen

import android.os.Handler
import android.os.Looper
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.Record
import io.github.expo.modules.v2.async.Promise

@Record
data class SplashScreenOptions(
  val duration: Long = 400L,
  val fade: Boolean = true
)

@ExpoModule("ExpoSplashScreen")
class SplashScreenModule : Module() {
  private var userControlledAutoHideEnabled: Boolean = false

  override fun onDestroy() {
    SplashScreenManager.unregisterContentAppearedListener()
  }

  @JS
  fun preventAutoHideAsync(): Promise<Boolean> {
    // The user has manually invoked prevent autohide, this is used to allow libraries
    // such as expo-router to know whether it's safe to hide or if they should wait for
    // the user to do it.
    userControlledAutoHideEnabled = true
    SplashScreenManager.preventAutoHideCalled = true
    return Promise.resolve(true)
  }

  @JS
  fun internalPreventAutoHideAsync(): Promise<Unit> {
    SplashScreenManager.preventAutoHideCalled = true
    return Promise.resolve()
  }

  @JS
  fun setOptions(options: SplashScreenOptions) {
    // Needs to run on the main thread on apis below 33
    Handler(Looper.getMainLooper()).post {
      SplashScreenManager.setSplashScreenOptions(options)
    }
  }

  @JS
  fun hide() {
    SplashScreenManager.hide()
  }

  // For backwards compatibility
  @JS
  fun hideAsync(): Promise<Unit> {
    SplashScreenManager.hide()
    return Promise.resolve()
  }

  @JS
  fun internalMaybeHideAsync(): Promise<Unit> {
    if (!userControlledAutoHideEnabled) {
      SplashScreenManager.hide()
    }
    return Promise.resolve()
  }
}
