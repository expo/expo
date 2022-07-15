package abi46_0_0.expo.modules.brightness

import android.content.Context
import abi46_0_0.expo.modules.core.BasePackage
import abi46_0_0.expo.modules.core.ExportedModule

class BrightnessPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(BrightnessModule(context))
  }
}
