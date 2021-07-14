package expo.modules.haptics

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.ViewManager

class HapticsPackage : BasePackage() {
  override fun createExportedModules(context: Context) =
    listOf(HapticsModule(context) as ExportedModule)
}
