package expo.modules.localization

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class LocalizationPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(LocalizationModule(context))
}
