package abi46_0_0.expo.modules.filesystem

import android.content.Context
import abi46_0_0.expo.modules.core.BasePackage
import abi46_0_0.expo.modules.core.ExportedModule
import abi46_0_0.expo.modules.core.interfaces.InternalModule

class FileSystemPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> =
    listOf<InternalModule>(FilePermissionModule())

  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf<ExportedModule>(FileSystemModule(context))
}
