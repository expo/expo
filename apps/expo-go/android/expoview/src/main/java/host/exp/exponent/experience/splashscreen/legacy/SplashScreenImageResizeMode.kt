package host.exp.exponent.experience.splashscreen.legacy

import android.widget.ImageView
import androidx.compose.ui.layout.ContentScale

enum class SplashScreenImageResizeMode(
  val scaleType: ImageView.ScaleType,
  private val resizeMode: String
) {
  CONTAIN(ImageView.ScaleType.FIT_CENTER, "contain"),
  COVER(ImageView.ScaleType.CENTER_CROP, "cover"),
  NATIVE(ImageView.ScaleType.CENTER, "native");

  fun toContentScale(): ContentScale {
    return when (this) {
      CONTAIN -> ContentScale.Fit
      COVER -> ContentScale.Crop
      NATIVE -> ContentScale.FillBounds
    }
  }

  companion object {
    @JvmStatic
    fun fromString(resizeMode: String?): SplashScreenImageResizeMode? {
      for (mode in entries) {
        if (mode.resizeMode == resizeMode) {
          return mode
        }
      }
      return null
    }
  }
}
