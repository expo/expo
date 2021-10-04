package expo.modules.facebook

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class FacebookPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(FacebookModule(context))
}
