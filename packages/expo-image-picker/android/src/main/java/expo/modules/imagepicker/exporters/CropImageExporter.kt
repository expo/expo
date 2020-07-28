package expo.modules.imagepicker.exporters

import android.graphics.Rect
import android.net.Uri
import expo.modules.imagepicker.exporters.ImageExporter.Listener
import org.apache.commons.io.IOUtils
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileInputStream
import java.io.IOException

class CropImageExporter(private val mRotation: Int,
                        private val mCropRect: Rect,
                        private val mBase64: Boolean) : ImageExporter {

  // Note: Crop activity saves the result to the output file. So, we don't need to do it.
  override fun export(source: Uri, output: File, exporterListener: Listener) {
    val width: Int
    val height: Int
    var rot = mRotation % 360
    if (rot < 0) {
      rot += 360
    }

    if (rot == 0 || rot == 180) { // Rotation is right-angled only
      width = mCropRect.width()
      height = mCropRect.height()
    } else {
      width = mCropRect.height()
      height = mCropRect.width()
    }

    if (mBase64) {
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
