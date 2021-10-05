package expo.modules.systemnavigationbar

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.ReactActivityLifecycleListener
import expo.modules.core.interfaces.SingletonModule

class SystemNavigationBarPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SystemNavigationBarModule(context) as ExportedModule)
  }
  override fun createSingletonModules(context: Context?): List<SingletonModule> {
    return listOf(SystemNavigationBar)
  }
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SystemNavigationBarReactActivityLifecycleListener(activityContext))
  }
}
