package expo.modules.insights

import android.content.Context
import expo.modules.core.interfaces.ApplicationLifecycleListener
import expo.modules.core.interfaces.Package

class ExpoInsightsPackage : Package {
  override fun createApplicationLifecycleListeners(context: Context?): List<ApplicationLifecycleListener> {
    return listOf(ExpoInsightsApplicationLifecycle())
  }
}
