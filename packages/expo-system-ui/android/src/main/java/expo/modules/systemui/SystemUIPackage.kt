package expo.modules.systemui

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.ReactActivityLifecycleListener

class SystemUIPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SystemUIModule(context) as ExportedModule)
  }
  override fun createReactActivityLifecycleListeners(activityContext: Context): List<ReactActivityLifecycleListener> {
    return listOf(SystemUIReactActivityLifecycleListener(activityContext))
  }
}
