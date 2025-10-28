package expo.modules.logbox

import android.app.Activity
import android.content.Context
import android.os.Bundle
import com.facebook.react.ReactApplication
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class ExpoLogBoxPackage : Package {
  override fun createReactActivityLifecycleListeners(activityContext: Context?): List<ReactActivityLifecycleListener> {
    if (!BuildConfig.DEBUG || !BuildConfig.EXPO_UNSTABLE_LOG_BOX) {
      return emptyList()
    }

    return listOf(
      object : ReactActivityLifecycleListener {
        override fun onCreate(activity: Activity, savedInstanceState: Bundle?) {
          injectExpoLogBoxDevSupportManager((activity.application as ReactApplication).reactHost)
        }
      }
    )
  }
}
