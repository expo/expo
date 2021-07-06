package abi42_0_0.expo.modules.clipboard

import android.content.Context

import abi42_0_0.org.unimodules.core.BasePackage
import abi42_0_0.org.unimodules.core.ExportedModule

class ClipboardPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ClipboardModule(context) as ExportedModule)
  }
}
