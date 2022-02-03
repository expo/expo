package expo.modules.brightness

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class BrightnessPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(BrightnessModule(context))
  }
}
