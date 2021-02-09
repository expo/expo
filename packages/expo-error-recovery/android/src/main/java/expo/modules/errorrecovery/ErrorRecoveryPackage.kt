package expo.modules.errorrecovery

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule

class ErrorRecoveryPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> = listOf(ErrorRecoveryModule(context))
}
