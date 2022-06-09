package expo.modules.imagepicker.exporters

import android.graphics.Rect
import android.net.Uri
import expo.modules.imagepicker.exporters.ImageExporter.Listener
import org.apache.commons.io.IOUtils
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.IOException

class CropImageExporter(
  rotation: Int,
  cropRect: Rect,
  private val base64: Boolean
) : ImageExporter {
  private val rotation = (rotation + 360) % 360
  private val isImageHorizontal = this.rotation == 0 || this.rotation == 180
  private val width = if (isImageHorizontal) cropRect.width() else cropRect.height()
  private val height = if (isImageHorizontal) cropRect.height() else cropRect.width()

  // Note: Crop activity saves the result to the output file. So, we don't need to do it.
  override fun export(source: Uri, output: File, exporterListener: Listener) {
    if (base64) {
      ByteArrayOutputStream().use { base64Stream ->
        try {
          FileInputStream(source.path!!).use { input ->
            // `CropImage` nullifies the `result.getBitmap()` after it writes out to a file, so
            // we have to read back.
            IOUtils.copy(input, base64Stream)
            exporterListener.onResult(base64Stream, width, height)
          }
        } catch (e: NullPointerException) {
          exporterListener.onFailure(e)
        } catch (e: IOException) {
          exporterListener.onFailure(e)
        }
      }
      return
    }

    exporterListener.onResult(null, width, height)
  }
}
