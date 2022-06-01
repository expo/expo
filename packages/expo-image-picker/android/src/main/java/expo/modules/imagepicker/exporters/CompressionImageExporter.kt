package expo.modules.imagepicker.exporters

import android.graphics.Bitmap
import android.net.Uri
import androidx.annotation.FloatRange
import expo.modules.imagepicker.exporters.ImageExporter.Listener
import expo.modules.interfaces.imageloader.ImageLoaderInterface
import org.apache.commons.io.FilenameUtils
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class CompressionImageExporter(
  private val imageLoader: ImageLoaderInterface,
  @FloatRange(from = 0.0, to = 1.0)
  quality: Double,
  private val base64: Boolean
) : ImageExporter {
  private val quality: Int = (quality * 100).toInt()

  override fun export(source: Uri, output: File, exporterListener: Listener) {
    val imageLoaderHandler = object : ImageLoaderInterface.ResultListener {
      override fun onSuccess(bitmap: Bitmap) {
        val width = bitmap.width
        val height = bitmap.height
        (if (base64) ByteArrayOutputStream() else null).use { base64Stream ->
          try {
            val compressFormat = if (FilenameUtils.getExtension(output.path).contains("png")) {
              Bitmap.CompressFormat.PNG
            } else {
              Bitmap.CompressFormat.JPEG
            }

            saveBitmap(bitmap, compressFormat, output, base64Stream)
            exporterListener.onResult(base64Stream, width, height)
          } catch (e: IOException) {
            exporterListener.onFailure(e)
          }
        }
      }

      override fun onFailure(cause: Throwable?) {
        exporterListener.onFailure(cause)
      }
    }

    imageLoader.loadImageForManipulationFromURL(source.toString(), imageLoaderHandler)
  }

  /**
   * Compress and save the `bitmap` to `file`, optionally saving it in `out` if
   * base64 is requested.
   *
   * @param bitmap bitmap to be saved
   * @param compressFormat compression format to save the image in
   * @param output file to save the image to
   * @param out if not null, the stream to save the image to
   */
  @Throws(IOException::class)
  private fun saveBitmap(bitmap: Bitmap, compressFormat: Bitmap.CompressFormat, output: File, out: ByteArrayOutputStream?) {
    writeImage(bitmap, output, compressFormat)
    if (base64) {
      bitmap.compress(Bitmap.CompressFormat.JPEG, quality, out)
    }
  }

  @Throws(IOException::class)
  private fun writeImage(image: Bitmap, output: File, compressFormat: Bitmap.CompressFormat) {
    FileOutputStream(output).use { out -> image.compress(compressFormat, quality, out) }
  }
}
