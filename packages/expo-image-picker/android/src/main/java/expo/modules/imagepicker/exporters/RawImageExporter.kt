package expo.modules.imagepicker.exporters

import android.content.ContentResolver
import android.graphics.BitmapFactory
import android.media.ExifInterface
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
    val exifInterface = ExifInterface(output.absolutePath)
    val imageRotation = exifInterface.getAttributeInt(ExifInterface.TAG_ORIENTATION, 0)
    val isRotatedLandscape = (imageRotation == ExifInterface.ORIENTATION_ROTATE_90 || imageRotation == ExifInterface.ORIENTATION_ROTATE_270)
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }

    BitmapFactory.decodeFile(output.absolutePath, options)

    // Image will be rotated to orientation suggested by the exif data, because of that the width and height
    // returned by the picker should be switched if the image is rotated 90 or 270 degrees.
    val width: Int = if (isRotatedLandscape) options.outHeight else options.outWidth
    val height: Int = if (isRotatedLandscape) options.outWidth else options.outHeight

    return ImageExportResult(
      width,
      height,
      output,
    )
  }
}
