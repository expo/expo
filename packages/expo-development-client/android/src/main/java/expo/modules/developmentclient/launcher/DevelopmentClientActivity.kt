package expo.modules.developmentclient.launcher

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import expo.modules.developmentclient.DevelopmentClientController
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch

class DevelopmentClientActivity : ReactActivity() {
  override fun getMainComponentName() = "main"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return object : ReactActivityDelegate(this, mainComponentName) {
      private var wasCreated = false

      override fun getReactNativeHost() = DevelopmentClientController.instance.devClientHost

      override fun onCreate(savedInstanceState: Bundle?) {
        if (isDevClientIntent(intent)) {
          val data = requireNotNull(intent.data)
          if (data.host == "open-app") {
            val path = requireNotNull(data.path).removePrefix("/")
            GlobalScope.launch {
              DevelopmentClientController.instance.loadApp(path)
              plainActivity.finish()
            }
          }
        } else {
          super.onCreate(savedInstanceState)
          wasCreated = true
        }
      }

      override fun onResume() {
        if (wasCreated) {
          super.onResume()
        }
      }

      override fun onPause() {
        if (wasCreated) {
          super.onPause()
        }
      }

      override fun onDestroy() {
        if (wasCreated) {
          super.onDestroy()
        }
      }

      private fun isDevClientIntent(intent: Intent?): Boolean {
        return intent?.data?.scheme == "dev-client"
      }
    }
  }

  override fun onPause() {
    super.onPause()
    overridePendingTransition(0, 0)
  }
}
