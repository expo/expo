package expo.modules.imagemanipulator

import android.graphics.Bitmap
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

data class SaveOptions(
  @Field
  val base64: Boolean = false,

  @Field
  val compress: Double = 1.0,

  @Field
  var format: ImageFormat = ImageFormat.JPEG
) : Record {
  val compressFormat
    get() = when (format) {
      ImageFormat.JPEG, ImageFormat.JPG -> Bitmap.CompressFormat.JPEG
      ImageFormat.PNG -> Bitmap.CompressFormat.PNG
    }
}

enum class ImageFormat(val value: String) : Enumerable {
  JPEG("jpeg"),
  JPG("jpg"),
  PNG("png")
}

data class ManipulateAction(
  @Field
  var resize: ResizeOptions?,

  @Field
  val rotate: Double?,

  @Field
  val flip: FlipType?,

  @Field
  val crop: CropRect?
) : Record

data class ResizeOptions(
  @Field
  val width: Double?,

  @Field
  val height: Double?
) : Record

data class CropRect(
  @Field
  val originX: Double = 0.0,

  @Field
  val originY: Double = 0.0,

  @Field
  val width: Double = 0.0,

  @Field
  val height: Double = 0.0
) : Record

enum class FlipType(val value: String) : Enumerable {
  VERTICAL("vertical"),
  HORIZONTAL("horizontal")
}

data class ImageResult(
  @Field
  val uri: String,

  @Field
  val width: Int,

  @Field
  val height: Int,

  @Field
  val base64: String?
) : Record
