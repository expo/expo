package expo.modules.webbrowser

import android.content.Context
import android.content.Intent
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class WebBrowserPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener?> {
    return listOf(
      object : ReactActivityLifecycleListener {
        override fun onNewIntent(intent: Intent): Boolean {
          if (intent.action == "android.intent.action.VIEW") {
            val browserProxy = BrowserProxyActivity.instance.get()
            if (browserProxy?.isFinishing == false) {
              browserProxy.finishAndRemoveTask()
            }
          }

          return false
        }
      }
    )
  }
}
