package host.exp.exponent.experience.splashscreen

import android.graphics.Color
import androidx.annotation.ColorInt
import expo.modules.jsonutils.getNullable
import host.exp.exponent.experience.splashscreen.legacy.SplashScreenImageResizeMode
import expo.modules.manifests.core.Manifest
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
  var appName: String? = null
    private set

  companion object {
    @JvmStatic
    fun parseManifest(manifest: Manifest): ManagedAppSplashScreenConfiguration {
      val mode: SplashScreenImageResizeMode? = parseResizeMode(manifest)
      val backgroundColor = parseBackgroundColor(manifest)
      val imageUrl = parseImageUrl(manifest)
      val name = manifest.getName()
      val config = ManagedAppSplashScreenConfiguration()
      mode?.let {
        config.resizeMode = it
      }
      backgroundColor?.let {
        config.backgroundColor = it
      }
      imageUrl?.let {
        config.imageUrl = it
      }
      name?.let {
        config.appName = it
      }
      return config
    }

    private fun parseResizeMode(manifest: Manifest): SplashScreenImageResizeMode? {
      val splashInfo = manifest.getSplashInfo()
      val resizeMode = splashInfo?.getNullable<String>("resizeMode")
      return SplashScreenImageResizeMode.fromString(resizeMode)
    }

    private fun parseBackgroundColor(manifest: Manifest): Int? {
      val splashInfo = manifest.getSplashInfo()
      val backgroundColor = splashInfo?.getNullable<String>("backgroundColor")

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
      // Because of the changes to splashscreen we are going to default to the app icon in expo go
      val iconUrl = manifest.getIconUrl()
      if (iconUrl != null) {
        return iconUrl
      }

      val splashInfo = manifest.getSplashInfo()
      if (splashInfo != null) {
        val dpiRelatedImageUrl = getStringFromJSONObject(
          splashInfo,
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

      return splashInfo?.getNullable("imageUrl")
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
