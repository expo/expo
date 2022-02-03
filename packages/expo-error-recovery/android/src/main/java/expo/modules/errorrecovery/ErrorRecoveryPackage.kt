package expo.modules.errorrecovery

import android.content.Context

import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule

class ErrorRecoveryPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> = listOf(ErrorRecoveryModule(context))
}
