package expo.modules.imagemanipulator

import java.io.File
import java.io.IOException
import java.util.*

internal object FileUtils {
  @Throws(IOException::class)
  fun ensureDirExists(dir: File): File {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
    }
    return dir
  }

  @Throws(IOException::class)
  fun generateOutputPath(internalDirectory: File, dirName: String, extension: String): String {
    val directory = File(internalDirectory.toString() + File.separator + dirName)
    ensureDirExists(directory)
    val filename = UUID.randomUUID().toString()
    return directory.toString() + File.separator + filename + extension
  }
}
