package expo.modules.facebook

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.facebook.FacebookModule

class FacebookPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> {
    return listOf(FacebookModule(context) as ExportedModule)
  }
}
