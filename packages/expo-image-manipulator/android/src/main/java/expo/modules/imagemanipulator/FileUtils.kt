package expo.modules.imagemanipulator

import java.io.File
import java.io.IOException
import java.util.*

internal object FileUtils {
  @Throws(IOException::class)
  fun generateRandomOutputPath(cacheDirectory: File, imageFormat: ImageFormat): String {
    val directory = File(cacheDirectory, "ImageManipulator")
    ensureDirExists(directory)
    return "${directory}${File.separator}${UUID.randomUUID()}${imageFormat.fileExtension}"
  }

  @Throws(IOException::class)
  private fun ensureDirExists(dir: File): File {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw ImageWriteFailedException(dir.path)
    }
    return dir
  }
}
