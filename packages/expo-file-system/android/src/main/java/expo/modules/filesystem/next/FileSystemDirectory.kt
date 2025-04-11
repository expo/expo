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

  fun create(options: CreateOptions = CreateOptions()) {
    validateType()
    validatePermission(Permission.WRITE)
    validateCanCreate(options)
    if (options.overwrite && file.exists()) {
      file.delete()
    }
    val created = if (options.intermediates) {
      file.mkdirs()
    } else {
      file.mkdir()
    }
    if (!created) {
      throw UnableToCreateException("directory already exists or could not be created")
    }
  }

  // this function is internal and will be removed in the future (when returning arrays of shared objects is supported)
  fun listAsRecords(): List<Map<String, Any>> {
    validateType()
    validatePermission(Permission.READ)
    return file.listFiles()?.map {
      val uriString = Uri.fromFile(it).toString()
      mapOf(
        "isDirectory" to it.isDirectory,
        "uri" to if (uriString.endsWith("/")) uriString else "$uriString/"
      )
    } ?: emptyList()
  }

  fun asString(): String {
    val uriString = Uri.fromFile(file).toString()
    return if (uriString.endsWith("/")) uriString else "$uriString/"
  }
}
