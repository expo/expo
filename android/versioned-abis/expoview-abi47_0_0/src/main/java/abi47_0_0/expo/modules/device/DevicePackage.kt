package abi47_0_0.expo.modules.device

import android.content.Context
import abi47_0_0.expo.modules.core.BasePackage
import abi47_0_0.expo.modules.core.ExportedModule

class DevicePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(DeviceModule(context))
  }
}
