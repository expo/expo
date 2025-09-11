package expo.modules.filesystem

import android.net.Uri
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
    return file.walkTopDown().filter { it.isFile() }.map { it.length() }.sum()
  }

  fun info(): DirectoryInfo {
    validateType()
    validatePermission(Permission.READ)
    if (!file.exists()) {
      val directoryInfo = DirectoryInfo(
        exists = false,
        uri = slashifyFilePath(file.uri.toString())
      )
      return directoryInfo
    }

    val directoryInfo = DirectoryInfo(
      exists = true,
      uri = slashifyFilePath(file.uri.toString()),
      files = file.listFilesAsUnified().mapNotNull { i -> i.fileName },
      modificationTime = modificationTime,
      creationTime = creationTime,
      size = size
    )
    return directoryInfo
  }

  fun create(options: CreateOptions = CreateOptions()) {
    validateType()
    validatePermission(Permission.WRITE)
    if (!needsCreation(options)) {
      return
    }
    validateCanCreate(options)
    if (uri.isContentUri) {
      throw UnableToCreateException("create function does not work with SAF Uris, use `createDirectory` and `createFile` instead")
    }
    if (options.overwrite && file.exists()) {
      file.delete()
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
    validateType()
    validatePermission(Permission.WRITE)
    val newFile = file.createFile(mimeType ?: "text/plain", fileName) ?: throw UnableToCreateException("file could not be created")
    return FileSystemFile(newFile.uri)
  }

  fun createDirectory(fileName: String): FileSystemDirectory {
    validateType()
    validatePermission(Permission.WRITE)
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

  fun needsCreation(options: CreateOptions): Boolean {
    return !file.exists() || !options.idempotent
  }
}
