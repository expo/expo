package expo.modules.imagepicker.exporters

import android.graphics.BitmapFactory
import androidx.exifinterface.media.ExifInterface
import java.io.File

/**
 * Image will be rotated to orientation suggested by the exif data, because of that the width and height
 * returned by the picker should be switched if the image is rotated 90 or 270 degrees.
 */
class DimensionsExporter(private val file: File) {
  private val isRotatedLandscape by lazy {
    val exifInterface = ExifInterface(file.absolutePath)
    val imageRotation = exifInterface.getAttributeInt(ExifInterface.TAG_ORIENTATION, 0)
    return@lazy (
      imageRotation == ExifInterface.ORIENTATION_ROTATE_90 ||
        imageRotation == ExifInterface.ORIENTATION_ROTATE_270 ||
        imageRotation == ExifInterface.ORIENTATION_TRANSPOSE ||
        imageRotation == ExifInterface.ORIENTATION_TRANSVERSE
      )
  }

  private val metadata by lazy {
    val options = BitmapFactory.Options().apply { inJustDecodeBounds = true }
    BitmapFactory.decodeFile(file.absolutePath, options)
    options
  }

  val width: Int
    get() = if (isRotatedLandscape) metadata.outHeight else metadata.outWidth

  val height
    get() = if (isRotatedLandscape) metadata.outWidth else metadata.outHeight
}
