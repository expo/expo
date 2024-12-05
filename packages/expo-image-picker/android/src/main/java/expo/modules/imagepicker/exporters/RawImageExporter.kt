package expo.modules.imagepicker.exporters

import android.content.ContentResolver
import android.net.Uri
import expo.modules.imagepicker.copyFile
import java.io.File

class RawImageExporter : ImageExporter {
  override suspend fun exportAsync(
    source: Uri,
    output: File,
    contentResolver: ContentResolver
  ): ImageExportResult {
    copyFile(source, output, contentResolver)
    val dimensionsExporter = DimensionsExporter(output)

    return ImageExportResult(
      dimensionsExporter.width,
      dimensionsExporter.height,
      output
    )
  }
}
