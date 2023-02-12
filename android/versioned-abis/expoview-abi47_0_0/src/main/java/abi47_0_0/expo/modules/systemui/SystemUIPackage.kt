package abi47_0_0.expo.modules.systemui

import android.content.Context
import abi47_0_0.expo.modules.core.BasePackage
import abi47_0_0.expo.modules.core.ExportedModule
import abi47_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener

class SystemUIPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SystemUIModule(context) as ExportedModule)
  }
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SystemUIReactActivityLifecycleListener(activityContext))
  }
}
