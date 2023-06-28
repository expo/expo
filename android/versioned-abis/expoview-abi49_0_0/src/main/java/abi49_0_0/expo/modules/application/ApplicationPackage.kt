package abi49_0_0.expo.modules.application

import android.content.Context
import abi49_0_0.expo.modules.core.BasePackage
import abi49_0_0.expo.modules.core.ExportedModule

class ApplicationPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(ApplicationModule(context) as ExportedModule)
  }
}
