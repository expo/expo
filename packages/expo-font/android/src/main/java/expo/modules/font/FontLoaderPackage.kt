package expo.modules.font

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class FontLoaderPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf<ExportedModule>(FontLoaderModule(context))
  }
}
