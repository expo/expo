package abi43_0_0.expo.modules.print

import android.content.Context
import abi43_0_0.expo.modules.core.BasePackage
import abi43_0_0.expo.modules.core.ExportedModule

class PrintPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(PrintModule(context))
  }
}
