package host.exp.exponent.experience.splashscreen

import android.graphics.Color
import androidx.annotation.ColorInt
import expo.modules.splashscreen.SplashScreenImageResizeMode
import host.exp.exponent.ExponentManifest
import host.exp.exponent.utils.ColorParser
import org.json.JSONObject

class ExperienceSplashScreenConfiguration private constructor() {
  var resizeMode: SplashScreenImageResizeMode = SplashScreenImageResizeMode.CONTAIN
    private set
  @ColorInt
  var backgroundColor = Color.parseColor("#ffffff")
    private set
  var imageUrl: String? = null
    private set

  companion object {
    @JvmStatic
    fun parseManifest(manifest: JSONObject): ExperienceSplashScreenConfiguration {
      val mode: SplashScreenImageResizeMode? = parseResizeMode(manifest)
      val backgroundColor = parseBackgroundColor(manifest)
      val imageUrl = parseImageUrl(manifest)
      val config = ExperienceSplashScreenConfiguration()
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

    private fun parseResizeMode(manifest: JSONObject): SplashScreenImageResizeMode? {
      val resizeMode = getStringFromManifest(
        manifest,
        arrayOf(
          ExponentManifest.MANIFEST_ANDROID_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_RESIZE_MODE_KEY
        ),
        arrayOf(
          ExponentManifest.MANIFEST_SPLASH_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_RESIZE_MODE_KEY
        )
      )
      return SplashScreenImageResizeMode.fromString(resizeMode)
    }

    private fun parseBackgroundColor(manifest: JSONObject): Int? {
      val backgroundColor = getStringFromManifest(
        manifest,
        arrayOf(
          ExponentManifest.MANIFEST_ANDROID_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_BACKGROUND_COLOR_KEY
        ),
        arrayOf(
          ExponentManifest.MANIFEST_SPLASH_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_BACKGROUND_COLOR_KEY
        )
      )
      return if (ColorParser.isValid(backgroundColor)) {
        Color.parseColor(backgroundColor)
      } else null
    }

    private fun parseImageUrl(manifest: JSONObject): String? {
      return getStringFromManifest(
        manifest,
        arrayOf(
          ExponentManifest.MANIFEST_ANDROID_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_IMAGE_URL_KEY
        ),
        arrayOf(
          ExponentManifest.MANIFEST_SPLASH_INFO_KEY,
          ExponentManifest.MANIFEST_SPLASH_IMAGE_URL_KEY
        )
      )
    }

    private fun getStringFromManifest(manifest: JSONObject, vararg paths: Array<String>): String? {
      for (path in paths) {
        val pathResult = getStringFromManifest(manifest, path)
        if (pathResult != null) {
          return pathResult
        }
      }
      return null
    }

    private fun getStringFromManifest(manifest: JSONObject, path: Array<String>): String? {
      var json: JSONObject? = manifest
      for (i in path.indices) {
        val isLastKey = i == path.size - 1
        val key = path[i]
        if (!json!!.has(key)) {
          break
        }
        if (isLastKey) {
          return json.optString(key)
        }
        json = json.optJSONObject(key)
      }
      return null
    }
  }
}