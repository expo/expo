package expo.modules.clipboard

import android.graphics.Bitmap
import io.github.expo.modules.v2.Enumerable
import io.github.expo.modules.v2.Record

@Record
data class GetImageOptions(
  val format: ImageFormat = ImageFormat.JPG,
  val jpegQuality: Double = 1.0
)

@Record
data class GetStringOptions(
  val preferredFormat: StringFormat = StringFormat.PLAIN
)

@Record
data class SetStringOptions(
  val inputFormat: StringFormat = StringFormat.PLAIN,
  val isSensitive: Boolean = false
)

@Record
data class SetImageOptions(
  val isSensitive: Boolean = false
)

enum class ImageFormat(val jsName: String) : Enumerable {
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

enum class StringFormat(val jsValue: String) : Enumerable {
  PLAIN("plainText"),
  HTML("html")
}
