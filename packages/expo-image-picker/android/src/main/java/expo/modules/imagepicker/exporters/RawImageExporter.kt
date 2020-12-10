package expo.modules.imagepicker.exporters

import android.content.ContentResolver
import android.graphics.BitmapFactory
import android.net.Uri
import expo.modules.imagepicker.exporters.ImageExporter.Listener
import org.apache.commons.io.IOUtils
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.io.IOException

class RawImageExporter(private val contentResolver: ContentResolver,
                       private val mBase64: Boolean) : ImageExporter {

  override fun export(source: Uri, output: File, exporterListener: Listener) {
    val base64Stream = if (mBase64) ByteArrayOutputStream() else null
    base64Stream.use {
      try {
        copyImage(source, output, base64Stream)

        val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(output.absolutePath, options)

        exporterListener.onResult(base64Stream, options.outWidth, options.outHeight)
      } catch (e: IOException) {
        exporterListener.onFailure(e)
      }
    }
  }

  /**
   * Copy the image file from `originalUri` to `file`, optionally saving it in
   * `out` if base64 is requested.
   *
   * @param originalUri uri to the file to copy the data from
   * @param file        file to save the image to
   * @param out         if not null, the stream to save the image to
   */
  @Throws(IOException::class)
  private fun copyImage(originalUri: Uri, file: File, out: ByteArrayOutputStream?) {
    contentResolver.openInputStream(originalUri)?.use { input ->
      if (out != null) {
        IOUtils.copy(input, out)
      }
      if (originalUri.compareTo(Uri.fromFile(file)) != 0) { // do not copy file over the same file
        FileOutputStream(file).use { fos ->
          if (out != null) {
            fos.write(out.toByteArray())
          } else {
            IOUtils.copy(input, fos)
          }
        }
      }
    }
  }

}
