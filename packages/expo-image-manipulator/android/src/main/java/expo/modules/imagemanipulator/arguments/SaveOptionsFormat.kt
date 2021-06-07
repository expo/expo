package expo.modules.imagemanipulator.arguments

import android.graphics.Bitmap.CompressFormat

enum class SaveOptionsFormat(private val mFormat: String, val compressFormat: CompressFormat, val fileExtension: String) {
  JPEG("jpeg", CompressFormat.JPEG, ".jpg"), PNG("png", CompressFormat.PNG, ".png");

  companion object {
    @Throws(IllegalArgumentException::class)
    fun fromObject(o: Any): SaveOptionsFormat {
      val errorMessage = "SaveOption 'format' must be one of ['png', 'jpeg']. Obtained '$o'"
      require(o is String) { errorMessage }
      for (f in values()) {
        if (f.mFormat == o) {
          return f
        }
      }
      throw IllegalArgumentException(errorMessage)
    }
  }
}
