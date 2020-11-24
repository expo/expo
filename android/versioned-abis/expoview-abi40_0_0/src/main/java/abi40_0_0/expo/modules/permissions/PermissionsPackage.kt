package abi40_0_0.expo.modules.permissions

import android.content.Context

import abi40_0_0.org.unimodules.core.BasePackage
import abi40_0_0.org.unimodules.core.ExportedModule
import abi40_0_0.org.unimodules.core.interfaces.InternalModule

class PermissionsPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule>
    = listOf(PermissionsService(context))

  override fun createExportedModules(reactContext: Context): List<ExportedModule>
    = listOf(PermissionsModule(reactContext))
}
