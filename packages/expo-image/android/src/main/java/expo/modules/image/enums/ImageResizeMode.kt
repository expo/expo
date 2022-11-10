package expo.modules.image.enums

import android.widget.ImageView
import com.facebook.react.bridge.JSApplicationIllegalArgumentException

enum class ImageResizeMode(val stringValue: String) {
  CONTAIN("contain"),
  COVER("cover"),
  STRETCH("stretch"),
  CENTER("center"),
  REPEAT("repeat");

  internal fun getScaleType() = when (this) {
    CONTAIN -> ImageView.ScaleType.FIT_CENTER
    COVER -> ImageView.ScaleType.CENTER_CROP
    STRETCH -> ImageView.ScaleType.FIT_XY
    CENTER -> ImageView.ScaleType.CENTER
    REPEAT -> ImageView.ScaleType.FIT_XY
  }

  companion object {
    fun fromStringValue(value: String): ImageResizeMode =
      values().firstOrNull { it.stringValue == value }
        ?: throw JSApplicationIllegalArgumentException("Invalid resizeMode: $value")
  }
}
