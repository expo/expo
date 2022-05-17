package expo.modules.imagepicker.exporters

import android.graphics.BitmapFactory
import android.net.Uri
import expo.modules.imagepicker.copyFile
import expo.modules.kotlin.providers.ContextProvider
import java.io.File

class RawImageExporter(
  private val contextProvider: ContextProvider,
) : ImageExporter {
  override suspend fun exportAsync(
    source: Uri,
    output: File,
  ): ImageExportResult {
    copyFile(source, output, contextProvider)

    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(output.absolutePath, options)

    return ImageExportResult(
      options.outWidth,
      options.outHeight,
      contextProvider,
      output,
    )
  }
}
