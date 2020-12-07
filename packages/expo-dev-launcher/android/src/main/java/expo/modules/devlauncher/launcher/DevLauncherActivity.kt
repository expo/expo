package expo.modules.devlauncher.launcher

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import expo.modules.devlauncher.DevLauncherController

class DevLauncherActivity : ReactActivity() {
  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : ReactActivityDelegate(this, mainComponentName) {
      override fun getReactNativeHost() = DevLauncherController.instance.devClientHost
    }
  }

  override fun onStart() {
    overridePendingTransition(0, 0)
    super.onStart()
  }

  override fun onPause() {
    overridePendingTransition(0, 0)
    super.onPause()
  }
}
