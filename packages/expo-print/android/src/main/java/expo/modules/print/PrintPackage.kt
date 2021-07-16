package expo.modules.print

import android.content.Context
import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule

class PrintPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(PrintModule(context))
  }
}
