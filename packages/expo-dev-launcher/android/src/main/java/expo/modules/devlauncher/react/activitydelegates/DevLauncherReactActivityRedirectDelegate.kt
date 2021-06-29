package expo.modules.devlauncher.react.activitydelegates

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import expo.modules.devlauncher.splashscreen.DevLauncherSplashScreenProvider

class DevLauncherReactActivityRedirectDelegate(
  activity: ReactActivity,
  private val redirect: (Intent?) -> Unit
) : DevLauncherReactActivityNOPDelegate(activity) {

  override fun onCreate(savedInstanceState: Bundle?) {
    DevLauncherSplashScreenProvider()
      .attachSplashScreenViewAsync(plainActivity)
    redirect(plainActivity.intent)
  }
}
