package expo.modules.navigationbar

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class NavigationBarPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(NavigationBarModule(context) as ExportedModule)
  }
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(NavigationBarReactActivityLifecycleListener(activityContext))
  }
}
