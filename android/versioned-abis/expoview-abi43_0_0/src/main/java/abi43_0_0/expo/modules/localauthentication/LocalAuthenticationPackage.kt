package abi43_0_0.expo.modules.localauthentication

import android.content.Context
import abi43_0_0.expo.modules.core.BasePackage
import abi43_0_0.expo.modules.core.ExportedModule

class LocalAuthenticationPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf<ExportedModule>(LocalAuthenticationModule(context))
  }
}
