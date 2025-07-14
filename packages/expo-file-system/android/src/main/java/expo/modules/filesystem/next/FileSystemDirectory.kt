package expo.modules.filesystem.next

import android.content.Context
import android.net.Uri
import expo.modules.interfaces.filesystem.Permission
import java.io.File
import java.net.URI

class FileSystemDirectory(uri: Uri) : FileSystemPath(uri) {
  fun validatePath() {
// Kept empty for now, but can be used to validate if the path is a valid directory path.
  }

  override fun validateType() {
      if (file.exists() == true && !file.isDirectory) {
        throw InvalidTypeFolderException()
      }
  }

  val exists: Boolean get() {
    return if (checkPermission(Permission.READ)) {
      file.isDirectory
    } else {
      false
    }
  }

  val size: Long get() {
    validatePermission(Permission.READ)
    validateType()
    return javaFile.walkTopDown().filter { it.isFile }.map { it.length() }.sum()
  }

  fun create(options: CreateOptions = CreateOptions()) {
    validateType()
    validatePermission(Permission.WRITE)
    validateCanCreate(options)
    if (options.overwrite && file.exists()) {
      javaFile.delete()
    }
    val created = if (options.intermediates) {
      javaFile.mkdirs()
    } else {
      javaFile.mkdir()
    }
    if (!created) {
      throw UnableToCreateException("directory already exists or could not be created")
    }
  }

  fun createFile(mimeType: String?, fileName: String): FileSystemFile {
    val newFile = file.createFile(mimeType ?: "text/plain", fileName) ?: throw UnableToCreateException("file could not be created")
    return FileSystemFile(newFile.uri)
  }

  fun createDirectory(fileName: String): FileSystemDirectory {
    val newDirectory = file.createDirectory(fileName) ?: throw UnableToCreateException("directory could not be created")
    return FileSystemDirectory(newDirectory.uri)
  }

  // this function is internal and will be removed in the future (when returning arrays of shared objects is supported)
  fun listAsRecords(): List<Map<String, Any>> {
    validateType()
    validatePermission(Permission.READ)
    return file.listFiles().map {
        val uriString = it.uri.toString()
        mapOf(
          "isDirectory" to it.isDirectory,
          "uri" to if (uriString.endsWith("/")) uriString else "$uriString/"
        )
      }
  }

  fun asString(): String {
    val uriString = file.uri.toString()
    return if (uriString.endsWith("/")) uriString else "$uriString/"
  }
}
