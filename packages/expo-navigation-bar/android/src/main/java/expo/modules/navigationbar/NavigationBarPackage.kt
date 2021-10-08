package expo.modules.navigationbar

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.SingletonModule

class NavigationBarPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(NavigationBarModule(context) as ExportedModule)
  }
  override fun createSingletonModules(context: Context?): List<SingletonModule> {
    return listOf(NavigationBar)
  }
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(NavigationBarReactActivityLifecycleListener(activityContext))
  }
}
