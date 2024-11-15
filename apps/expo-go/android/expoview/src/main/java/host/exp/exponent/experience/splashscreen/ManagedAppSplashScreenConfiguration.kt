package host.exp.exponent.experience.splashscreen

import android.graphics.Color
import androidx.annotation.ColorInt
import expo.modules.jsonutils.getNullable
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenImageResizeMode
import expo.modules.manifests.core.Manifest
import host.exp.exponent.ExponentManifest
import host.exp.exponent.utils.ColorParser
import org.json.JSONObject

class ManagedAppSplashScreenConfiguration private constructor() {
  var resizeMode: SplashScreenImageResizeMode = SplashScreenImageResizeMode.CONTAIN
    private set

  @ColorInt
  var backgroundColor = Color.parseColor("#ffffff")
    private set
  var imageUrl: String? = null
    private set

  companion object {
    @JvmStatic
    fun parseManifest(manifest: Manifest): ManagedAppSplashScreenConfiguration {
      val mode: SplashScreenImageResizeMode? = parseResizeMode(manifest)
      val backgroundColor = parseBackgroundColor(manifest)
      val imageUrl = parseImageUrl(manifest)
      val config = ManagedAppSplashScreenConfiguration()
      if (mode != null) {
        config.resizeMode = mode
      }
      if (backgroundColor != null) {
        config.backgroundColor = backgroundColor
      }
      if (imageUrl != null) {
        config.imageUrl = imageUrl
      }
      return config
    }

    private fun parseResizeMode(manifest: Manifest): SplashScreenImageResizeMode? {
      val androidSplashInfo = manifest.getAndroidSplashInfo()
      val rootSplashInfo = manifest.getRootSplashInfo()
      val resizeMode = androidSplashInfo?.getNullable<String>(ExponentManifest.MANIFEST_SPLASH_RESIZE_MODE_KEY)
        ?: rootSplashInfo?.getNullable(ExponentManifest.MANIFEST_SPLASH_RESIZE_MODE_KEY)
      return SplashScreenImageResizeMode.fromString(resizeMode)
    }

    private fun parseBackgroundColor(manifest: Manifest): Int? {
      val androidSplashInfo = manifest.getAndroidSplashInfo()
      val rootSplashInfo = manifest.getRootSplashInfo()
      val backgroundColor = androidSplashInfo?.getNullable<String>(ExponentManifest.MANIFEST_SPLASH_BACKGROUND_COLOR_KEY)
        ?: rootSplashInfo?.getNullable(ExponentManifest.MANIFEST_SPLASH_BACKGROUND_COLOR_KEY)

      return if (ColorParser.isValid(backgroundColor)) {
        Color.parseColor(backgroundColor)
      } else {
        null
      }
    }

    /**
     * Tries to retrieve imageUrl from the manifest checking for value for keys/paths in following order
     * - android-scoped splash dpi images (starting from 'xxx-hdpi" and ending with 'mdpi')
     * - android-scoped splash imageUrl
     * - generic splash imageUrl
     */
    private fun parseImageUrl(manifest: Manifest): String? {
      val pluginInfo = manifest.getPluginProperties("expo-splash-screen")
      pluginInfo?.let { info ->
        val url = manifest.getIconUrl()?.split("./")?.get(0)
        val pluginUrl = info["image"] as String?
        url?.let {
          return "$it$pluginUrl"
        }
        return info["image"] as String?
      }

      val androidSplash = manifest.getAndroidSplashInfo()
      if (androidSplash != null) {
        val dpiRelatedImageUrl = getStringFromJSONObject(
          androidSplash,
          *arrayOf(
            "xxxhdpi",
            "xxhdpi",
            "xhdpi",
            "hdpi",
            "mdpi"
          )
            .map { s -> "${s}Url" }
            .map { s -> arrayOf(s) }
            .toTypedArray()
        )
        if (dpiRelatedImageUrl != null) {
          return dpiRelatedImageUrl
        }
      }

      val androidSplashInfo = manifest.getAndroidSplashInfo()
      val rootSplashInfo = manifest.getRootSplashInfo()
      return androidSplashInfo?.getNullable(ExponentManifest.MANIFEST_SPLASH_IMAGE_URL_KEY)
        ?: rootSplashInfo?.getNullable(ExponentManifest.MANIFEST_SPLASH_IMAGE_URL_KEY)
    }

    private fun getStringFromJSONObject(jsonObject: JSONObject, vararg paths: Array<String>): String? {
      for (path in paths) {
        val pathResult = getStringFromJSONObject(jsonObject, path)
        if (pathResult != null) {
          return pathResult
        }
      }
      return null
    }

    private fun getStringFromJSONObject(jsonObject: JSONObject, path: Array<String>): String? {
      var json: JSONObject? = jsonObject
      for (i in path.indices) {
        val isLastKey = i == path.size - 1
        val key = path[i]
        if (!json!!.has(key)) {
          break
        }
        if (isLastKey) {
          return json.getNullable(key)
        }
        json = json.optJSONObject(key)
      }
      return null
    }
  }
}
