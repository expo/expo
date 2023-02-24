package abi47_0_0.expo.modules.intentlauncher

import android.content.Context

import abi47_0_0.expo.modules.core.BasePackage
import abi47_0_0.expo.modules.core.ExportedModule

class IntentLauncherPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(IntentLauncherModule(context))
}
