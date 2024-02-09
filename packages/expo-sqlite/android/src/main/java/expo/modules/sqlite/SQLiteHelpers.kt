package expo.modules.sqlite

import java.io.File
import java.io.IOException

@Throws(IOException::class)
internal fun ensureDirExists(dir: File): File {
  if (!dir.isDirectory) {
    if (dir.isFile) {
      throw IOException("Path '$dir' points to a file, but must point to a directory.")
    }
    if (!dir.mkdirs()) {
      var additionalErrorMessage = ""
      if (dir.exists()) {
        additionalErrorMessage = "Path already points to a non-normal file."
      }
      if (dir.parentFile == null) {
        additionalErrorMessage = "Parent directory is null."
      }
      throw IOException("Couldn't create directory '$dir'. $additionalErrorMessage")
    }
  }
  return dir
}
