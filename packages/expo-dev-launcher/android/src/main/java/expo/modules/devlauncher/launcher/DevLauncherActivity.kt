package expo.modules.devlauncher.launcher

import android.os.Build
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import expo.modules.devlauncher.DevLauncherController
import java.util.*

class DevLauncherActivity : ReactActivity() {
  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : ReactActivityDelegate(this, mainComponentName) {
      override fun getReactNativeHost() = DevLauncherController.instance.devClientHost

      override fun getLaunchOptions() = Bundle().apply {
        putBoolean("isSimulator", isSimulator)
      }
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

  private val isSimulator
    get() = Build.FINGERPRINT.contains("vbox") || Build.FINGERPRINT.contains("generic")
}
