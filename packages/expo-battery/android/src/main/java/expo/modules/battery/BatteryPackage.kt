package expo.modules.battery

import android.content.Context
import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule

class BatteryPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(BatteryModule(context))
  }
}
