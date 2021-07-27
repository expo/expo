package expo.modules.localauthentication

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class LocalAuthenticationPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf<ExportedModule>(LocalAuthenticationModule(context))
  }
}
