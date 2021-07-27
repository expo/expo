package expo.modules.print

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class PrintPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(PrintModule(context))
  }
}
