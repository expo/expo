package expo.modules.appmetrics

import android.content.Context
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import expo.modules.appmetrics.appstartup.AppStartupManager
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package
import expo.modules.core.interfaces.ReactActivityHandler
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class AppMetricsPackage : Package {
  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener?> =
    listOf(AppMetricsApplicationLifecycleListeners())

  override fun createReactActivityLifecycleListeners(context: Context?): List<ReactActivityLifecycleListener?> =
    listOf(AppMetricsActivityLifecycleListeners())

  override fun createReactActivityHandlers(activityContext: Context?): List<ReactActivityHandler> =
    listOf(
      object : ReactActivityHandler {
        // This is the earliest point where we can capture the activity creation timestamp, without using config plugin
        override fun onDidCreateReactActivityDelegateNotification(
          activity: ReactActivity?,
          delegate: ReactActivityDelegate?
        ) {
          activity ?: return
          AppStartupManager.markActivityCreate()
        }
      }
    )
}
