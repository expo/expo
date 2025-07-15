package expo.modules.filesystem.next

import android.net.Uri
import expo.modules.filesystem.slashifyFilePath
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
    return if (checkPermission(Permission.READ)) {
      file.isDirectory
    } else {
      false
    }
  }

  val size: Long get() {
    validatePermission(Permission.READ)
    validateType()
    return file.walkTopDown().filter { it.isFile }.map { it.length() }.sum()
  }

  fun info(): DirectoryInfo {
    validateType()
    validatePermission(Permission.READ)
    if (!file.exists()) {
      val directoryInfo = DirectoryInfo(
        exists = false,
        uri = slashifyFilePath(file.toURI().toString())
      )
      return directoryInfo
    }

    when {
      file.toURI().scheme == "file" -> {
        val directoryInfo = DirectoryInfo(
          exists = true,
          uri = slashifyFilePath(file.toURI().toString()),
          files = file.listFiles()?.map { i -> i.name },
          modificationTime = modificationTime,
          creationTime = creationTime,
          size = size
        )
        return directoryInfo
      }
      else -> throw UnableToGetInfoException("file schema ${file.toURI().scheme} is not supported")
    }
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
