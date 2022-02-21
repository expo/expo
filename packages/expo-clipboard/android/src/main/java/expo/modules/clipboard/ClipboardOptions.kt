package expo.modules.clipboard

import android.graphics.Bitmap
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class GetImageOptions : Record {
  @Field(key = "format")
  lateinit var imageFormat: ImageFormat

  @Field
  val jpegQuality: Double = 1.0
}

enum class ImageFormat(val jsName: String) {
  JPG("jpeg"), PNG("png");

  val compressFormat: Bitmap.CompressFormat
    get() = when (this) {
      JPG -> Bitmap.CompressFormat.JPEG
      PNG -> Bitmap.CompressFormat.PNG
    }

  val mimeType: String
    get() = when (this) {
      JPG -> "image/jpeg"
      PNG -> "image/png"
    }
}
