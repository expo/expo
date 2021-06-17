package expo.modules.image.enums

import android.widget.ImageView

enum class ImageResizeMode(val stringValue: String, val scaleType: ImageView.ScaleType?) {
  UNKNOWN("unknown", null), CONTAIN("contain", ImageView.ScaleType.FIT_CENTER), COVER("cover", ImageView.ScaleType.CENTER_CROP), STRETCH("stretch", ImageView.ScaleType.FIT_XY), CENTER("center", ImageView.ScaleType.CENTER), REPEAT("repeat", ImageView.ScaleType.FIT_XY);

  companion object {
    fun fromStringValue(value: String): ImageResizeMode {
      for (resizeMode in values()) {
        if (resizeMode.stringValue == value) {
          return resizeMode
        }
      }
      return UNKNOWN
    }
  }
}