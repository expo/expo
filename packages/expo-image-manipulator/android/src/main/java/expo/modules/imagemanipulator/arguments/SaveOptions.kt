package expo.modules.imagemanipulator.arguments

import expo.modules.core.arguments.ReadableArguments
import android.graphics.Bitmap.CompressFormat

private const val KEY_BASE64 = "base64"
private const val KEY_COMPRESS = "compress"
private const val KEY_FORMAT = "format"

data class SaveOptions(
  val base64: Boolean,
  val compress: Double,
  val format: CompressFormat
) {
  companion object {
    fun fromArguments(arguments: ReadableArguments): SaveOptions {
      val base64 = arguments.getBoolean(KEY_BASE64, false)
      val compress = arguments.getDouble(KEY_COMPRESS, 1.0)
      val format = toCompressFormat(arguments.getString(KEY_FORMAT, "jpeg"))
      return SaveOptions(base64, compress, format)
    }
  }
}

fun toCompressFormat(format: String): CompressFormat {
  return when (format) {
    "jpeg" -> CompressFormat.JPEG
    "png" -> CompressFormat.PNG
    else -> CompressFormat.JPEG
  }
}
