package expo.modules.intentlauncher

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class IntentLauncherPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf(IntentLauncherModule(context))
}
