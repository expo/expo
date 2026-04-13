package host.exp.exponent.experience.splashscreen

import android.content.Context
import android.graphics.Color
import android.util.DisplayMetrics
import androidx.annotation.ColorInt
import expo.modules.jsonutils.getNullable
import expo.modules.manifests.core.Manifest
import host.exp.exponent.utils.ColorParser

class ManagedAppSplashScreenConfiguration private constructor() {

  @ColorInt
  var backgroundColor = Color.parseColor("#ffffff")
    private set
  var imageUrl: String? = null
    private set
  var imageWidth: Int? = null
    private set

  companion object {
    @JvmStatic
    fun parseManifest(context: Context, manifest: Manifest): ManagedAppSplashScreenConfiguration {
      val backgroundColor = parseBackgroundColor(manifest)
      val imageUrl = parseImageUrl(context, manifest)
      val imageWidth = parseImageWidth(manifest)

      val config = ManagedAppSplashScreenConfiguration()

      backgroundColor?.let { config.backgroundColor = it }
      imageUrl?.let { config.imageUrl = it }
      imageWidth?.let { config.imageWidth = it }

      return config
    }

    private fun parseBackgroundColor(manifest: Manifest): Int? {
      val splashInfo = manifest.getSplashInfo() ?: return null
      val backgroundColor = splashInfo.getNullable<String>("backgroundColor")

      return if (ColorParser.isValid(backgroundColor)) {
        Color.parseColor(backgroundColor)
      } else {
        null
      }
    }

    private fun parseImageUrl(context: Context, manifest: Manifest): String? {
      val densityDpi = context.resources.displayMetrics.densityDpi
      val splashInfo = manifest.getSplashInfo()

      val imageUrl = splashInfo?.getNullable<String>(
        when {
          densityDpi >= DisplayMetrics.DENSITY_XXXHIGH -> "xxxhdpi"
          densityDpi >= DisplayMetrics.DENSITY_XXHIGH -> "xxhdpi"
          densityDpi >= DisplayMetrics.DENSITY_XHIGH -> "xhdpi"
          densityDpi >= DisplayMetrics.DENSITY_HIGH -> "hdpi"
          densityDpi >= DisplayMetrics.DENSITY_MEDIUM -> "mdpi"
          else -> "image"
        }
      )

      // if the splash configuration is not set, we default to the app icon
      return imageUrl ?: manifest.getIconUrl()
    }

    private fun parseImageWidth(manifest: Manifest): Int? {
      val splashInfo = manifest.getSplashInfo()
      return splashInfo?.getNullable("imageWidth")
    }
  }
}
