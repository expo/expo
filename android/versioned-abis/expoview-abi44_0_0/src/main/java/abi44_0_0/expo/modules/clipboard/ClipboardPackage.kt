package abi44_0_0.expo.modules.clipboard

import android.content.Context

import abi44_0_0.expo.modules.core.BasePackage
import abi44_0_0.expo.modules.core.ExportedModule

class ClipboardPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ClipboardModule(context) as ExportedModule)
  }
}
