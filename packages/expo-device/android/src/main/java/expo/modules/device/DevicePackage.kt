package expo.modules.device

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class DevicePackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(DeviceModule(context))
  }
}
