package expo.modules.filesystem.next

import android.net.Uri
import expo.modules.filesystem.slashifyFilePath
import expo.modules.interfaces.filesystem.Permission

class FileSystemDirectory(uri: Uri) : FileSystemPath(uri) {
  fun validatePath() {
// Kept empty for now, but can be used to validate if the path is a valid directory path.
  }

  override fun validateType() {
    if (file.exists() && !file.isDirectory()) {
      throw InvalidTypeFolderException()
    }
  }

  val exists: Boolean get() {
    return if (checkPermission(Permission.READ)) {
      file.isDirectory()
    } else {
      false
    }
  }

  val size: Long get() {
    validatePermission(Permission.READ)
    validateType()
    return javaFile.walkTopDown().filter { it.isFile }.map { it.length() }.sum()
  }

  fun info(): DirectoryInfo {
    validateType()
    validatePermission(Permission.READ)
    if (!file.exists()) {
      val directoryInfo = DirectoryInfo(
        exists = false,
        uri = slashifyFilePath(javaFile.toURI().toString())
      )
      return directoryInfo
    }

    when {
      javaFile.toURI().scheme == "file" -> {
        val directoryInfo = DirectoryInfo(
          exists = true,
          uri = slashifyFilePath(javaFile.toURI().toString()),
          files = javaFile.listFiles()?.map { i -> i.name },
          modificationTime = modificationTime,
          creationTime = creationTime,
          size = size
        )
        return directoryInfo
      }
      else -> throw UnableToGetInfoException("file schema ${javaFile.toURI().scheme} is not supported")
    }
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
    return file.listFilesAsUnified().map {
      val uriString = it.uri.toString()
      mapOf(
        "isDirectory" to it.isDirectory(),
        "uri" to if (uriString.endsWith("/")) uriString else "$uriString/"
      )
    }
  }

  fun asString(): String {
    val uriString = file.uri.toString()
    return if (uriString.endsWith("/")) uriString else "$uriString/"
  }
}
