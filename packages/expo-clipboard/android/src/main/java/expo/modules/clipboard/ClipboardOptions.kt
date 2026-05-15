package expo.modules.clipboard

import android.graphics.Bitmap
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
internal class GetImageOptions : Record {
  @Field(key = "format")
  var imageFormat: ImageFormat = ImageFormat.JPG

  @Field
  var jpegQuality: Double = 1.0
}

@OptimizedRecord
internal class GetStringOptions : Record {
  @Field
  var preferredFormat: StringFormat = StringFormat.PLAIN
}

@OptimizedRecord
internal class SetStringOptions : Record {
  @Field
  var inputFormat: StringFormat = StringFormat.PLAIN
}

internal enum class ImageFormat(val jsName: String) : Enumerable {
  JPG("jpeg"),
  PNG("png");

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

internal enum class StringFormat(val jsValue: String) : Enumerable {
  PLAIN("plainText"),
  HTML("html")
}
