package expo.modules.splashscreen

import android.widget.ImageView

enum class SplashScreenMode(val scaleType: ImageView.ScaleType, private val resizeMode: String) {
  CONTAIN(ImageView.ScaleType.FIT_CENTER, "contain"),
  COVER(ImageView.ScaleType.CENTER_CROP, "cover"),
  NATIVE(ImageView.ScaleType.CENTER, "native");

  companion object {
    @JvmStatic
    fun fromString(resizeMode: String?): SplashScreenMode? {
      for (mode in values()) {
        if (mode.resizeMode == resizeMode) {
          return mode
        }
      }
      return null
    }
  }
}