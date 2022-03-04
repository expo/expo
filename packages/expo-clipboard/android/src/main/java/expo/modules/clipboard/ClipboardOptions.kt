package expo.modules.clipboard

import android.graphics.Bitmap
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class GetImageOptions : Record {
  @Field(key = "format")
  var imageFormat: ImageFormat = ImageFormat.JPG

  @Field
  var jpegQuality: Double = 1.0
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

internal enum class StringContentType(val jsValue: String) {
  PLAIN("plainText"), HTML("html");
}

internal class GetStringOptions : Record {
  @Field
  var preferredType: StringContentType = StringContentType.PLAIN
}

internal class SetStringOptions : Record {
  @Field
  var inputType: StringContentType = StringContentType.PLAIN
}
