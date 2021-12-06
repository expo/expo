package abi44_0_0.expo.modules.localization

import android.content.Context
import abi44_0_0.expo.modules.core.BasePackage
import abi44_0_0.expo.modules.core.ExportedModule

class LocalizationPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(LocalizationModule(context))
}
