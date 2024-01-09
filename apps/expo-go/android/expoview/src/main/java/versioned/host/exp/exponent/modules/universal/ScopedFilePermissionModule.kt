package versioned.host.exp.exponent.modules.universal

import expo.modules.core.ModuleRegistry
import expo.modules.filesystem.FilePermissionModule
import expo.modules.interfaces.filesystem.Permission
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
      // Scoped context is only an Expo Go concept, so we should forbid access to data directory.
      val context = scopedContext.context
      val dataDirCanonicalPath = File(context.applicationInfo.dataDir).canonicalPath
      val canonicalPath = File(path).canonicalPath
      val isInDataDir = canonicalPath.startsWith("$dataDirCanonicalPath/") || (canonicalPath == dataDirCanonicalPath)
      if (isInDataDir) {
        return EnumSet.noneOf(Permission::class.java)
      }
    } catch (e: IOException) {
      // Something's not right, let's be cautious.
      return EnumSet.noneOf(Permission::class.java)
    }
    return super.getExternalPathPermissions(path)
  }

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    this.moduleRegistry = moduleRegistry
  }
}
