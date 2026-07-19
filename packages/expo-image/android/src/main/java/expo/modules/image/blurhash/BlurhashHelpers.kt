package expo.modules.image.blurhash

import android.graphics.Bitmap
import kotlin.math.*

object BlurhashHelpers {
  fun srgbToLinear(colorEnc: Int): Float {
    val v = colorEnc / 255f
    return if (v <= 0.04045f) {
      (v / 12.92f)
    } else {
      ((v + 0.055f) / 1.055f).pow(2.4f)
    }
  }

  fun linearTosRGB(value: Float): Int {
    val v = max(0f, min(1f, value))
    return if (v <= 0.0031308) {
      (v * 12.92 * 255 + 0.5).toInt()
    } else {
      (1.055 * (v.pow(1f / 2.4f) - 0.055) * 255 + 0.5).toInt()
    }
  }

  fun signPow(value: Float, exp: Float): Float {
    return abs(value).pow(exp) * sign(value)
  }

  fun getBitsPerPixel(bitmap: Bitmap): Int {
    return when (bitmap.config) {
      Bitmap.Config.ARGB_8888 -> 32
      Bitmap.Config.RGB_565 -> 16
      Bitmap.Config.ALPHA_8 -> 8
      Bitmap.Config.ARGB_4444 -> 16
      else -> 0
    }
  }
}
