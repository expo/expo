package expo.modules.imagepicker.exporters

import android.content.ContentResolver
import android.graphics.BitmapFactory
import android.net.Uri
import expo.modules.imagepicker.copyFile
import java.io.File

class RawImageExporter : ImageExporter {
  override suspend fun exportAsync(
    source: Uri,
    output: File,
    contentResolver: ContentResolver,
  ): ImageExportResult {
    copyFile(source, output, contentResolver)

    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(output.absolutePath, options)

    return ImageExportResult(
      options.outWidth,
      options.outHeight,
      output,
    )
  }
}
