package expo.modules.filesystem.next

import android.net.Uri
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

  override fun exists(): Boolean {
    return file.isDirectory
  }

  fun create() {
    validateType()
    file.mkdir()
  }

  fun asString(): String {
    val uriString = Uri.fromFile(file).toString()
    return if (uriString.endsWith("/")) uriString else "$uriString/"
  }
}
