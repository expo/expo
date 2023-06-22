package abi49_0_0.expo.modules.filesystem

import android.content.Context
import abi49_0_0.expo.modules.core.BasePackage
import abi49_0_0.expo.modules.core.interfaces.InternalModule

class FileSystemPackage : BasePackage() {
  override fun createInternalModules(context: Context): List<InternalModule> =
    listOf(FilePermissionModule(), AppDirectoriesModule(context))
}
