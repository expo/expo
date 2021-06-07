package expo.modules.imagemanipulator.arguments

import org.unimodules.core.arguments.ReadableArguments

class SaveOptions private constructor(
  private val mBase64: Boolean,
  val compress: Double,
  val format: SaveOptionsFormat
) {
  fun hasBase64(): Boolean {
    return mBase64
  }

  companion object {
    private const val TAG = "saveOptions"
    private const val KEY_BASE64 = "base64"
    private const val KEY_COMPRESS = "compress"
    private const val KEY_FORMAT = "format"
    @Throws(IllegalArgumentException::class)
    fun fromArguments(options: ReadableArguments): SaveOptions {
      var base64 = false
      if (options.containsKey(KEY_BASE64)) {
        require(options[KEY_BASE64] is Boolean) { "'$TAG.$KEY_BASE64' must be a Boolean value" }
        base64 = options.getBoolean(KEY_BASE64)
      }
      var compress = 1.0
      if (options.containsKey(KEY_COMPRESS)) {
        require(options[KEY_COMPRESS] is Double) { "'$TAG.$KEY_COMPRESS' must be a Number value" }
        compress = options.getDouble(KEY_COMPRESS)
      }
      val mediaTypes: SaveOptionsFormat = SaveOptionsFormat.Companion.fromObject(options[KEY_FORMAT])
      return SaveOptions(base64, compress, mediaTypes)
    }
  }
}
