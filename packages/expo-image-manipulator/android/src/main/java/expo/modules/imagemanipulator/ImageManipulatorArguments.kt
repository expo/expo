package expo.modules.imagemanipulator

import android.graphics.Bitmap
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

/**
 * Options provided for resize action.
 */
class ResizeOptions : Record {
  @Field
  val width: Int? = null

  @Field
  val height: Int? = null
}

/**
 * Cropping rect for crop action.
 */
class CropRect : Record {
  @Field
  val originX: Double = 0.0

  @Field
  val originY: Double = 0.0

  @Field
  val width: Double = 0.0

  @Field
  val height: Double = 0.0
}

/**
 * Options to use when saving the resulted image.
 */
class ManipulateOptions : Record {
  @Field
  val base64: Boolean = false

  @Field
  val compress: Double = 1.0

  @Field
  val format: ImageFormat = ImageFormat.JPEG
}

/**
 * Possible options for flip action.
 */
enum class FlipType(val value: String) : Enumerable {
  VERTICAL("vertical"),
  HORIZONTAL("horizontal")
}

/**
 * Enum with supported image formats.
 */
enum class ImageFormat(val value: String) : Enumerable {
  JPEG("jpeg"),
  JPG("jpg"),
  PNG("png"),
  WEBP("webp");

  val fileExtension: String
    get() = when (this) {
      JPEG, JPG -> ".jpg"
      PNG -> ".png"
      WEBP -> ".webp"
    }

  val compressFormat: Bitmap.CompressFormat
    get() = when (this) {
      JPEG, JPG -> Bitmap.CompressFormat.JPEG
      PNG -> Bitmap.CompressFormat.PNG
      WEBP -> Bitmap.CompressFormat.WEBP
    }
}
