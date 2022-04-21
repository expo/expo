package abi45_0_0.expo.modules.battery

import android.content.Context
import abi45_0_0.expo.modules.core.BasePackage
import abi45_0_0.expo.modules.core.ExportedModule

class BatteryPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(BatteryModule(context))
  }
}
