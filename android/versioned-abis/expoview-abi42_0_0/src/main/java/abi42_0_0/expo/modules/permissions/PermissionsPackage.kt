package abi42_0_0.expo.modules.permissions

import android.content.Context

import abi42_0_0.org.unimodules.core.BasePackage
import abi42_0_0.org.unimodules.core.ExportedModule
import abi42_0_0.org.unimodules.core.interfaces.InternalModule

class PermissionsPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> =
    emptyList()

  override fun createExportedModules(reactContext: Context): List<ExportedModule> =
    listOf(PermissionsModule(reactContext))
}
