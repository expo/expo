package abi47_0_0.expo.modules.navigationbar

import android.content.Context
import abi47_0_0.expo.modules.core.BasePackage
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener

class NavigationBarPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(NavigationBarModule(context) as ExportedModule)
  }
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(NavigationBarReactActivityLifecycleListener(activityContext))
  }
}
