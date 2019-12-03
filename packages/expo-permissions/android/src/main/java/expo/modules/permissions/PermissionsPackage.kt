package expo.modules.permissions

import android.content.Context

import org.unimodules.core.BasePackage
import org.unimodules.core.ExportedModule
import org.unimodules.core.interfaces.InternalModule

class PermissionsPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule>
    = listOf(PermissionsService(context))

  override fun createExportedModules(reactContext: Context): List<ExportedModule>
    = listOf(PermissionsModule(reactContext))
}
