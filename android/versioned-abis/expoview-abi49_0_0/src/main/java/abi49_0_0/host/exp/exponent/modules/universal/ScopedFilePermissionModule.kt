package abi49_0_0.host.exp.exponent.modules.universal

import abi49_0_0.expo.modules.core.ModuleRegistry
import abi49_0_0.expo.modules.filesystem.FilePermissionModule
import abi49_0_0.expo.modules.interfaces.constants.ConstantsInterface
import abi49_0_0.expo.modules.interfaces.filesystem.Permission
import host.exp.exponent.utils.ScopedContext
import java.io.File
import java.io.IOException
import java.util.*

class ScopedFilePermissionModule(private val scopedContext: ScopedContext) : FilePermissionModule() {

  private lateinit var moduleRegistry: ModuleRegistry

  override fun getExternalPathPermissions(path: String): EnumSet<Permission> {
    try {
      // In scoped context we do not allow access to Expo Go's directory,
      // however accessing other directories is ok as far as we're concerned.
      val context = scopedContext.context
      val dataDirCanonicalPath = File(context.applicationInfo.dataDir).canonicalPath
      val canonicalPath = File(path).canonicalPath
      val isInDataDir = canonicalPath.startsWith("$dataDirCanonicalPath/") || (canonicalPath == dataDirCanonicalPath)
      if (shouldForbidAccessToDataDirectory() && isInDataDir) {
        return EnumSet.noneOf(Permission::class.java)
      }
    } catch (e: IOException) {
      // Something's not right, let's be cautious.
      return EnumSet.noneOf(Permission::class.java)
    }
    return super.getExternalPathPermissions(path)
  }

  private fun shouldForbidAccessToDataDirectory(): Boolean {
    val constantsModule = moduleRegistry.getModule(ConstantsInterface::class.java)
    // If there's no constants module, or app ownership isn't "expo", we're not in Expo Go.
    return constantsModule != null && "expo" == constantsModule.appOwnership
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }
}
