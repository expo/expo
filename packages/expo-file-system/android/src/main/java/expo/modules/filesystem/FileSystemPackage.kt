package expo.modules.filesystem

import android.content.Context
import expo.modules.core.BasePackage
import expo.modules.core.ExportedModule
import expo.modules.core.interfaces.InternalModule

class FileSystemPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> =
    listOf(FilePermissionModule(), AppDirectoriesModule(context))

  override fun createExportedModules(context: Context): List<ExportedModule> =
    listOf<ExportedModule>(FileSystemModule(context))
}
