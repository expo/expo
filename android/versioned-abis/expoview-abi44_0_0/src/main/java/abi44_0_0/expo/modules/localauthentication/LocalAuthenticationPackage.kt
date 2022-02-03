package abi44_0_0.expo.modules.localauthentication

import android.content.Context
import abi44_0_0.expo.modules.core.BasePackage
import abi44_0_0.expo.modules.core.ExportedModule

class LocalAuthenticationPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf<ExportedModule>(LocalAuthenticationModule(context))
  }
}
