package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException

class LegacyRawManifest(json: String) : BaseLegacyRawManifest(json) {
  @Throws(JSONException::class)
  fun getBundleKey(): String? = if (has("bundleKey")) {
    getString("bundleKey")
  } else {
    null
  }

  @Throws(JSONException::class)
  fun getReleaseId(): String = getString("releaseId")

  @Throws(JSONException::class)
  fun getCommitTime(): String = getString("commitTime")

  fun getRuntimeVersion(): Any? = opt("runtimeVersion")

  @Throws(JSONException::class)
  fun getSDKVersion(): String = getString("sdkVersion")

  @Throws(JSONException::class)
  fun getBundleURL(): String = getString("bundleUrl")

  @Throws(JSONException::class)
  fun getBundledAssets(): JSONArray? = optJSONArray("bundledAssets")

  fun isDevelopmentMode(): Boolean {
    return try {
      has("developer") &&
          has("packagerOpts") &&
          getJSONObject("packagerOpts").optBoolean("dev", false)
    } catch (e: JSONException) {
      false
    }
  }

  fun isUsingDeveloperTool(): Boolean {
    return try {
      has("developer") && getJSONObject("developer").has("tool")
    } catch (e: JSONException) {
      false
    }
  }
}
