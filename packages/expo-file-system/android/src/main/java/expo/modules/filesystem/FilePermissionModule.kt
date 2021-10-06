package expo.modules.filesystem

import android.content.Context
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.filesystem.Permission
import java.io.File
import java.io.IOException
import java.util.*

class FilePermissionModule : FilePermissionModuleInterface, InternalModule {
  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(FilePermissionModuleInterface::class.java)
  }

  override fun getPathPermissions(context: Context, path: String): EnumSet<Permission> {
    // getExternalPathPermissions guarantees not to return null
    return getInternalPathPermissions(path, context) ?: getExternalPathPermissions(path)
  }

  private fun getInternalPathPermissions(path: String, context: Context): EnumSet<Permission>? {
    try {
      val canonicalPath = File(path).canonicalPath
      for (dir in getInternalPaths(context)) {
        if (canonicalPath.startsWith("$dir/") || dir == canonicalPath) {
          return EnumSet.of(Permission.READ, Permission.WRITE)
        }
      }
    } catch (e: IOException) {
      return EnumSet.noneOf(Permission::class.java)
    }
    return null
  }

  private fun getExternalPathPermissions(path: String): EnumSet<Permission> {
    val file = File(path)
    return EnumSet.noneOf(Permission::class.java).apply {
      if (file.canRead()) {
        add(Permission.READ)
      }
      if (file.canWrite()) {
        add(Permission.WRITE)
      }
    }
  }

  @Throws(IOException::class)
  private fun getInternalPaths(context: Context): List<String> {
    return listOf(
      context.filesDir.canonicalPath,
      context.cacheDir.canonicalPath
    )
  }
}
