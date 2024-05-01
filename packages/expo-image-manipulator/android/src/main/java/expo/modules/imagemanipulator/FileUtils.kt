package expo.modules.imagemanipulator

import android.content.Context
import android.graphics.Bitmap.CompressFormat
import android.os.Build
import java.io.File
import java.io.IOException
import java.util.*

internal object FileUtils {
  @Throws(IOException::class)
  fun generateRandomOutputPath(context: Context, compressFormat: CompressFormat): String {
    val directory = File("${context.cacheDir}${File.separator}ImageManipulator")
    ensureDirExists(directory)
    return "${directory}${File.separator}${UUID.randomUUID()}${toExtension(compressFormat)}"
  }

  @Throws(IOException::class)
  private fun ensureDirExists(dir: File): File {
    if (!(dir.isDirectory || dir.mkdirs())) {
      throw IOException("Couldn't create directory '$dir'")
    }
    return dir
  }

  private fun toExtension(compressFormat: CompressFormat): String {
    return when (compressFormat) {
      CompressFormat.JPEG -> ".jpg"
      CompressFormat.PNG -> ".png"
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
        CompressFormat.WEBP_LOSSY
      } else {
        @Suppress("DEPRECATION")
        CompressFormat.WEBP
      } -> ".webp"
      else -> ".jpg"
    }
  }
}
