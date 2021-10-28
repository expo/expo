package expo.modules.systemui

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class SystemUIPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(SystemUIModule(context) as ExportedModule)
  }
}
