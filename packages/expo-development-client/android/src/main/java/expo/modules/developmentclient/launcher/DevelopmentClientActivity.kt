package expo.modules.developmentclient.launcher

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import expo.modules.developmentclient.DevelopmentClientController

class DevelopmentClientActivity : ReactActivity() {
  override fun getMainComponentName() = "main"
  lateinit var activityDelegate: ReactActivityDelegate

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    activityDelegate = object : ReactActivityDelegate(this, mainComponentName) {
      override fun getReactNativeHost() = DevelopmentClientController.instance.devClientHost
    }
    return activityDelegate
  }

  override fun onPause() {
    super.onPause()
    overridePendingTransition(0, 0)
  }
}
