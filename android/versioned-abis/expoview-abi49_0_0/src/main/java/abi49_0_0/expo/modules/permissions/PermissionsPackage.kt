package abi49_0_0.expo.modules.permissions

import android.content.Context

import abi49_0_0.expo.modules.core.BasePackage
import abi49_0_0.expo.modules.core.ExportedModule
import abi49_0_0.expo.modules.core.interfaces.InternalModule

class PermissionsPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> =
    emptyList()

  override fun createExportedModules(reactContext: Context): List<ExportedModule> =
    listOf(PermissionsModule(reactContext))
}
