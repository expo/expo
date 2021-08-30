package expo.modules.battery

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class BatteryPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(BatteryModule(context))
  }
}
