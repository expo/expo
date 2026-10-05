package expo.modules.devlauncher.react.activitydelegates

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import expo.modules.devlauncher.launcher.LocalNetworkPermission
import expo.modules.devlauncher.splashscreen.DevLauncherSplashScreenProvider

class DevLauncherReactActivityRedirectDelegate(
  activity: ReactActivity,
  private val redirect: (Intent?) -> Unit
) : DevLauncherReactActivityNOPDelegate(activity) {

  override fun onCreate(savedInstanceState: Bundle?) {
    DevLauncherSplashScreenProvider()
      .attachSplashScreenViewAsync(plainActivity)
    val requested = LocalNetworkPermission.requestIfNeeded(plainActivity) {
      plainActivity.requestPermissions(arrayOf(LocalNetworkPermission.PERMISSION), LocalNetworkPermission.REQUEST_CODE)
    }
    if (!requested) {
      redirect(plainActivity.intent)
    }
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
    if (requestCode == LocalNetworkPermission.REQUEST_CODE) {
      redirect(plainActivity.intent)
    }
  }
}
