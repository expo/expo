package host.exp.exponent.experience.splashscreen

import android.graphics.Color
import androidx.annotation.ColorInt
import expo.modules.splashscreen.SplashScreenImageResizeMode
import expo.modules.updates.manifest.raw.RawManifest
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
    fun parseManifest(manifest: RawManifest): ManagedAppSplashScreenConfiguration {
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

    private fun parseResizeMode(manifest: RawManifest): SplashScreenImageResizeMode? {
      val resizeMode = getStringFromJSONObject(
        manifest.getRawJson(),
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

    private fun parseBackgroundColor(manifest: RawManifest): Int? {
      val backgroundColor = getStringFromJSONObject(
        manifest.getRawJson(),
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

    /**
     * Tries to retrieve imageUrl from the manifest checking for value for keys/paths in following order
     * - android-scoped splash dpi images (starting from 'xxx-hdpi" and ending with 'mdpi')
     * - android-scoped splash imageUrl
     * - generic splash imageUrl
     */
    private fun parseImageUrl(manifest: RawManifest): String? {
      val androidSplash = manifest.getRawJson()
        .optJSONObject(ExponentManifest.MANIFEST_ANDROID_INFO_KEY)
        ?.optJSONObject(ExponentManifest.MANIFEST_SPLASH_INFO_KEY)
      if (androidSplash != null) {
        val dpiRelatedImageUrl = getStringFromJSONObject(
          androidSplash,
          *arrayOf("xxxhdpi", "xxhdpi", "xhdpi", "hdpi", "mdpi"
        )
          .map { s -> "${s}Url" }
          .map { s -> arrayOf(s) }
          .toTypedArray())
        if (dpiRelatedImageUrl != null) {
          return dpiRelatedImageUrl
        }
      }

      return getStringFromJSONObject(
        manifest.getRawJson(),
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
          return json.optString(key)
        }
        json = json.optJSONObject(key)
      }
      return null
    }
  }
}
