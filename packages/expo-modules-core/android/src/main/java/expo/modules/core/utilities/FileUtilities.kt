package expo.modules.core.utilities

import android.content.Context
import expo.modules.interfaces.filesystem.Permission
import java.io.File
import java.io.IOException
import java.util.EnumSet
import java.util.UUID

object FileUtilities {
  @Throws(IOException::class)
  fun ensureDirExists(dir: File): File {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
    }
    return dir
  }

  @Throws(IOException::class)
  fun generateOutputPath(internalDirectory: File, dirName: String, extension: String): String {
    val directory = File("${internalDirectory}${File.separator}${dirName}")
    ensureDirExists(directory)
    val filename = UUID.randomUUID().toString()
    val path = "${directory}${File.separator}$filename"
    val prefix = if (extension.startsWith(".")) extension else ".$extension"
    return path + prefix
  }
}

object FilePermissionsUtilities {
  fun getPathPermissions(context: Context, path: String): EnumSet<Permission> =
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
  private fun getInternalPaths(context: Context): List<String> =
    listOf(
      context.filesDir.canonicalPath,
      context.cacheDir.canonicalPath
    )
}