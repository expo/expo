package host.exp.exponent.experience.splashscreen

import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.util.DisplayMetrics
import androidx.annotation.ColorInt
import expo.modules.jsonutils.getNullable
import expo.modules.manifests.core.Manifest
import host.exp.exponent.utils.ColorParser
import org.json.JSONObject

class ManagedAppSplashScreenConfiguration private constructor() {

  @ColorInt
  var backgroundColor = Color.WHITE
    private set
  var imageUrl: String? = null
    private set
  var imageWidth: Int? = null
    private set

  companion object {
    @JvmStatic
    fun parseManifest(context: Context, manifest: Manifest): ManagedAppSplashScreenConfiguration {
      val splashInfo = manifest.getSplashInfo()

      if (
        context.resources.configuration.uiMode and Configuration.UI_MODE_NIGHT_MASK ==
        Configuration.UI_MODE_NIGHT_YES
      ) {
        splashInfo?.getNullable<JSONObject>("dark")?.let { dark ->
          dark.keys().forEach { key ->
            val value = dark.get(key)
            if (value is String) {
              splashInfo.put(key, value)
            }
          }
        }
      }

      val backgroundColor = parseBackgroundColor(splashInfo)
      val imageUrl = parseImageUrl(context, splashInfo) ?: manifest.getIconUrl()
      val imageWidth = parseImageWidth(splashInfo)

      val config = ManagedAppSplashScreenConfiguration()

      backgroundColor?.let { config.backgroundColor = it }
      imageUrl?.let { config.imageUrl = it }
      imageWidth?.let { config.imageWidth = it }

      return config
    }

    private fun parseBackgroundColor(splashInfo: JSONObject?): Int? {
      val color = splashInfo?.optString("backgroundColor")?.takeIf { it != "" } ?: return null

      val normalizedColor = when {
        Regex("^#([0-9a-fA-F]{3})$").matches(color) -> {
          val r = color[1]
          val g = color[2]
          val b = color[3]
          "#$r$r$g$g$b$b"
        }
        else -> color
      }

      return if (ColorParser.isValid(normalizedColor)) {
        Color.parseColor(normalizedColor)
      } else {
        null
      }
    }

    private fun parseImageUrl(context: Context, splashInfo: JSONObject?): String? {
      val densityDpi = context.resources.displayMetrics.densityDpi

      val key = when {
        densityDpi >= DisplayMetrics.DENSITY_XXXHIGH -> "xxxhdpi"
        densityDpi >= DisplayMetrics.DENSITY_XXHIGH -> "xxhdpi"
        densityDpi >= DisplayMetrics.DENSITY_XHIGH -> "xhdpi"
        densityDpi >= DisplayMetrics.DENSITY_HIGH -> "hdpi"
        densityDpi >= DisplayMetrics.DENSITY_MEDIUM -> "mdpi"
        else -> "image"
      }

      return splashInfo?.optString(key)?.takeIf { it != "" }
    }

    private fun parseImageWidth(splashInfo: JSONObject?): Int? =
      splashInfo?.optInt("imageWidth")?.takeIf { it != 0 }
  }
}
