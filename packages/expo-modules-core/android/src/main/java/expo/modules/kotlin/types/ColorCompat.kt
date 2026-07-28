package expo.modules.kotlin.types

import android.graphics.Color
import android.os.Build
import androidx.annotation.ColorInt
import androidx.annotation.RequiresApi

/**
 * Compatibility wrapper for [Color] instance APIs added in API 26.
 *
 * Remove this class when expo-modules-core minSdkVersion is 26 or higher. Android Lint's
 * ObsoleteSdkInt check should flag these version gates after that bump.
 */
class ColorCompat private constructor() {
  companion object {
    private val defaultLegacyColor = LegacyColor(
      red = 0f,
      green = 0f,
      blue = 0f,
      alpha = 1f,
      argb = Color.BLACK
    )

    @JvmStatic
    fun valueOf(@ColorInt color: Int): Color {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Api26Impl.valueOf(color)
      }
      return LegacyColor(
        red = Color.red(color) / 255f,
        green = Color.green(color) / 255f,
        blue = Color.blue(color) / 255f,
        alpha = Color.alpha(color) / 255f,
        argb = color
      )
    }

    @JvmStatic
    fun valueOf(red: Float, green: Float, blue: Float, alpha: Float): Color {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Api26Impl.valueOf(red, green, blue, alpha)
      }
      val saturatedRed = red.coerceIn(0f, 1f)
      val saturatedGreen = green.coerceIn(0f, 1f)
      val saturatedBlue = blue.coerceIn(0f, 1f)
      val saturatedAlpha = alpha.coerceIn(0f, 1f)
      return LegacyColor(
        red = saturatedRed,
        green = saturatedGreen,
        blue = saturatedBlue,
        alpha = saturatedAlpha,
        argb = Color.argb(
          toColorComponent(saturatedAlpha),
          toColorComponent(saturatedRed),
          toColorComponent(saturatedGreen),
          toColorComponent(saturatedBlue)
        )
      )
    }

    @JvmStatic
    fun toArgb(color: Color): Int {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Api26Impl.toArgb(color)
      }
      return legacyColor(color).argb
    }

    @JvmStatic
    fun alpha(color: Color): Float {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Api26Impl.alpha(color)
      }
      return legacyColor(color).alpha
    }

    @JvmStatic
    fun red(color: Color): Float {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Api26Impl.red(color)
      }
      return legacyColor(color).red
    }

    @JvmStatic
    fun green(color: Color): Float {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Api26Impl.green(color)
      }
      return legacyColor(color).green
    }

    @JvmStatic
    fun blue(color: Color): Float {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Api26Impl.blue(color)
      }
      return legacyColor(color).blue
    }

    private fun legacyColor(color: Color): LegacyColor {
      return color as? LegacyColor ?: defaultLegacyColor
    }

    private fun toColorComponent(component: Float): Int {
      return (component * 255f + 0.5f).toInt()
    }
  }

  private class LegacyColor(
    val red: Float,
    val green: Float,
    val blue: Float,
    val alpha: Float,
    @ColorInt val argb: Int
  ) : Color()

  @RequiresApi(Build.VERSION_CODES.O)
  private object Api26Impl {
    fun valueOf(@ColorInt color: Int): Color {
      return Color.valueOf(color)
    }

    fun valueOf(red: Float, green: Float, blue: Float, alpha: Float): Color {
      return Color.valueOf(red, green, blue, alpha)
    }

    fun toArgb(color: Color): Int {
      return color.toArgb()
    }

    fun alpha(color: Color): Float {
      return color.alpha()
    }

    fun red(color: Color): Float {
      return color.red()
    }

    fun green(color: Color): Float {
      return color.green()
    }

    fun blue(color: Color): Float {
      return color.blue()
    }
  }
}
