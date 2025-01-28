package expo.modules.imagemanipulator

import android.content.Context
import java.io.File
import java.io.IOException
import java.util.*

internal object FileUtils {
  @Throws(IOException::class)
  fun generateRandomOutputPath(context: Context, imageFormat: ImageFormat): String {
    val directory = File("${context.cacheDir}${File.separator}ImageManipulator")
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
