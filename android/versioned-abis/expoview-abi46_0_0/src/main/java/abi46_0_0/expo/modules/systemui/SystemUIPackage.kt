package abi46_0_0.expo.modules.systemui

import android.content.Context
import abi46_0_0.expo.modules.core.BasePackage
import abi46_0_0.expo.modules.core.ExportedModule
import abi46_0_0.expo.modules.core.interfaces.ReactActivityLifecycleListener

class SystemUIPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SystemUIModule(context) as ExportedModule)
  }
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SystemUIReactActivityLifecycleListener(activityContext))
  }
}
