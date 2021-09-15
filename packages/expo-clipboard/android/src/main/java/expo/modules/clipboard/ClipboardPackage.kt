package expo.modules.clipboard

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class ClipboardPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ClipboardModule(context) as ExportedModule)
  }
}
