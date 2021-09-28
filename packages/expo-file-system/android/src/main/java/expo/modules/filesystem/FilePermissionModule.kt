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
    return listOf<Class<*>>(FilePermissionModuleInterface::class.java)
  }

  override fun getPathPermissions(context: Context, path: String): EnumSet<Permission> {
    var permissions = getInternalPathPermissions(path, context)
    if (permissions == null) {
      permissions = getExternalPathPermissions(path)
    }
    // getExternalPathPermissions guarantees not to return null
    return permissions
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
    if (file.canWrite() && file.canRead()) {
      return EnumSet.of(Permission.READ, Permission.WRITE)
    }
    if (file.canWrite()) {
      return EnumSet.of(Permission.WRITE)
    }
    return if (file.canRead()) {
      EnumSet.of(Permission.READ)
    } else EnumSet.noneOf(Permission::class.java)
  }

  @Throws(IOException::class)
  private fun getInternalPaths(context: Context): List<String> {
    return listOf(
        context.filesDir.canonicalPath,
        context.cacheDir.canonicalPath
    )
  }
}
