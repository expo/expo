package abi46_0_0.expo.modules.errorrecovery

import android.content.Context

import abi46_0_0.expo.modules.core.BasePackage
import abi46_0_0.expo.modules.core.ExportedModule

class ErrorRecoveryPackage : BasePackage() {
  override fun createExportedModules(context: Context): List<ExportedModule> = listOf(ErrorRecoveryModule(context))
}
