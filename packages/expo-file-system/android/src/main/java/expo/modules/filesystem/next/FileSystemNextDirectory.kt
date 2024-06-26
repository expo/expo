package expo.modules.filesystem.next

import java.io.File

class FileSystemNextDirectory(file: File) : FileSystemNextPath(file) {
  fun validatePath() {
// Kept empty for now, but can be used to validate if the path is a valid directory path.
  }

  fun create() {
    path.mkdir()
  }
}
