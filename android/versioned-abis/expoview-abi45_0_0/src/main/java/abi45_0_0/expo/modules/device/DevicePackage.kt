package abi45_0_0.expo.modules.device

import android.content.Context
import abi45_0_0.expo.modules.core.BasePackage
import abi45_0_0.expo.modules.core.ExportedModule

class DevicePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(DeviceModule(context))
  }
}
