package expo.modules.filesystem.next

import android.net.Uri
import expo.modules.interfaces.filesystem.Permission
import java.io.File

class FileSystemDirectory(file: File) : FileSystemPath(file) {
  fun validatePath() {
// Kept empty for now, but can be used to validate if the path is a valid directory path.
  }

  override fun validateType() {
    if (file.exists() && !file.isDirectory) {
      throw InvalidTypeFolderException()
    }
  }

  val exists: Boolean get() {
    validatePermission(Permission.READ)
    return file.isDirectory
  }

  fun create() {
    validateType()
    validatePermission(Permission.WRITE)
    file.mkdir()
  }

  // this function is internal and will be removed in the future (when returning arrays of shared objects is supported)
  fun listAsRecords(): List<Map<String, Any>> {
    validateType()
    validatePermission(Permission.READ)
    return file.listFiles()?.map {
      mapOf(
        "isDirectory" to it.isDirectory,
        "path" to it.path
      )
    } ?: emptyList()
  }

  fun asString(): String {
    val uriString = Uri.fromFile(file).toString()
    return if (uriString.endsWith("/")) uriString else "$uriString/"
  }
}
