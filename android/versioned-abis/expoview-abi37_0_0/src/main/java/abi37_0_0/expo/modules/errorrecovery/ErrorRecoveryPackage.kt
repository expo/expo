package abi37_0_0.expo.modules.errorrecovery

import android.content.Context

import abi37_0_0.org.unimodules.core.BasePackage
import abi37_0_0.org.unimodules.core.ExportedModule

class ErrorRecoveryPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> = listOf(ErrorRecoveryModule(context))
}
