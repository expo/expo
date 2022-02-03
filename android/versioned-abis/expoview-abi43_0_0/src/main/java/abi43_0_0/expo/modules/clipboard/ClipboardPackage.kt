package abi43_0_0.expo.modules.clipboard

import android.content.Context

import abi43_0_0.expo.modules.core.BasePackage
import abi43_0_0.expo.modules.core.ExportedModule

class ClipboardPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ClipboardModule(context) as ExportedModule)
  }
}
