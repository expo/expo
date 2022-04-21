package abi45_0_0.expo.modules.facebook

import android.content.Context
import abi45_0_0.expo.modules.core.BasePackage
import abi45_0_0.expo.modules.core.ExportedModule

class FacebookPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(FacebookModule(context))
}
