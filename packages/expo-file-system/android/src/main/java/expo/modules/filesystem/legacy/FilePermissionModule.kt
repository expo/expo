package expo.modules.filesystem.legacy

import android.content.Context
import expo.modules.interfaces.filesystem.FilePermissionModuleInterface
import expo.modules.core.interfaces.InternalModule
import expo.modules.interfaces.filesystem.Permission
import java.io.File
import java.io.IOException
import java.util.*

// The class needs to be 'open', because it's inherited in expoview
open class FilePermissionModule : FilePermissionModuleInterface, InternalModule {
  override fun getExportedInterfaces(): List<Class<*>> =
    listOf(FilePermissionModuleInterface::class.java)

  override fun getPathPermissions(context: Context, path: String): EnumSet<Permission> =
    getInternalPathPermissions(path, context) ?: getExternalPathPermissions(path)

  private fun getInternalPathPermissions(path: String, context: Context): EnumSet<Permission>? {
    return try {
      val canonicalPath = File(path).canonicalPath
      getInternalPaths(context)
        .firstOrNull { dir -> canonicalPath.startsWith("$dir/") || dir == canonicalPath }
        ?.let { EnumSet.of(Permission.READ, Permission.WRITE) }
    } catch (e: IOException) {
      EnumSet.noneOf(Permission::class.java)
    }
  }

  protected open fun getExternalPathPermissions(path: String): EnumSet<Permission> {
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
  private fun getInternalPaths(context: Context): List<String> =
    listOf(
      context.filesDir.canonicalPath,
      context.cacheDir.canonicalPath
    )
}
