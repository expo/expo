package expo.modules.image.enums

import android.widget.ImageView
import expo.modules.kotlin.types.Enumerable

enum class ImageResizeMode(val value: String) : Enumerable {
  CONTAIN("contain"),
  COVER("cover"),
  STRETCH("stretch"),
  CENTER("center"),
  REPEAT("repeat");

  internal fun getScaleType() = when (this) {
    CONTAIN -> ImageView.ScaleType.FIT_CENTER
    COVER -> ImageView.ScaleType.CENTER_CROP
    STRETCH -> ImageView.ScaleType.FIT_XY
    CENTER -> ImageView.ScaleType.CENTER_INSIDE
    REPEAT -> ImageView.ScaleType.FIT_XY
  }
}
