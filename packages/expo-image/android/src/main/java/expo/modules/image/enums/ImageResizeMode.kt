package expo.modules.image.enums

import android.widget.ImageView
import com.facebook.react.bridge.JSApplicationIllegalArgumentException

enum class ImageResizeMode(val stringValue: String, val scaleType: ImageView.ScaleType?) {
  CONTAIN("contain", ImageView.ScaleType.FIT_CENTER),
  COVER("cover", ImageView.ScaleType.CENTER_CROP),
  STRETCH("stretch", ImageView.ScaleType.FIT_XY),
  CENTER("center", ImageView.ScaleType.CENTER),
  REPEAT("repeat", ImageView.ScaleType.FIT_XY);

  companion object {
    fun fromStringValue(value: String): ImageResizeMode =
      values().firstOrNull { it.stringValue == value }
        ?: throw JSApplicationIllegalArgumentException("Invalid resizeMode: $value")
  }
}
