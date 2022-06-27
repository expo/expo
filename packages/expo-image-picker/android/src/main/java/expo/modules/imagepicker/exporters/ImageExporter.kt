package expo.modules.imagepicker.exporters

import android.content.ContentResolver
import android.net.Uri
import android.os.Bundle
import androidx.core.net.toUri
import androidx.exifinterface.media.ExifInterface
import expo.modules.imagepicker.FailedToReadFileException
import expo.modules.imagepicker.ImagePickerConstants
import kotlinx.coroutines.runInterruptible
import java.io.ByteArrayOutputStream
import java.io.File

/**
 * Interface allowing exporting an image in a different ways.
 */
interface ImageExporter {
  /**
   * Export the file under `source` [Uri] to the `output` [File]
   */
  suspend fun exportAsync(source: Uri, output: File, contentResolver: ContentResolver): ImageExportResult
}

/**
 * Results of exporting an image to the given file.
 * Allows accessing extra data associated with the underlying image file.
 */
open class ImageExportResult(
  val width: Int,
  val height: Int,
  private val imageFile: File,
) {
  /**
   * Allows accessing the underlying byte data in a lazy manner.
   */
  open suspend fun data(contentResolver: ContentResolver): ByteArrayOutputStream = runInterruptible {
    contentResolver.openInputStream(imageFile.toUri())?.use { inputStream ->
      ByteArrayOutputStream().use { outputStream ->
        inputStream.copyTo(outputStream)
        return@runInterruptible outputStream
      }
    } ?: throw FailedToReadFileException(imageFile)
  }

  /**
   * Allows accessing to the EXIF data associated with this image.
   */
  open suspend fun exif(contentResolver: ContentResolver): Bundle = runInterruptible {
    contentResolver.openInputStream(imageFile.toUri())?.use { inputStream ->
      return@runInterruptible Bundle().apply {
        val exifInterface = ExifInterface(inputStream)

        ImagePickerConstants.EXIF_TAGS
          .filter { (_, tag) -> exifInterface.getAttribute(tag) != null }
          .forEach { (type, tag) ->
            when (type) {
              "string" -> putString(tag, exifInterface.getAttribute(tag))
              "int" -> putInt(tag, exifInterface.getAttributeInt(tag, 0))
              "double" -> putDouble(tag, exifInterface.getAttributeDouble(tag, 0.0))
            }
          }
        // Explicitly get latitude, longitude, altitude with their specific accessor functions.
        exifInterface.latLong?.let { latLong ->
          putDouble(ExifInterface.TAG_GPS_LATITUDE, latLong[0])
          putDouble(ExifInterface.TAG_GPS_LONGITUDE, latLong[1])
          putDouble(ExifInterface.TAG_GPS_ALTITUDE, exifInterface.getAltitude(0.0))
        }
      }
    } ?: throw FailedToReadFileException(imageFile)
  }
}
