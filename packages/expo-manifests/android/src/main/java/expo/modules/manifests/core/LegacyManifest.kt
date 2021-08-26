package expo.modules.manifests.core

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

open class LegacyManifest(json: JSONObject) : BaseLegacyManifest(json) {
  @Throws(JSONException::class)
  fun getBundleKey(): String? = if (json.has("bundleKey")) {
    json.getString("bundleKey")
  } else {
    null
  }

  @Throws(JSONException::class)
  fun getReleaseId(): String = json.getString("releaseId")

  fun getRuntimeVersion(): String? = if (json.has("runtimeVersion")) {
    json.getString("runtimeVersion")
  } else {
    null
  }

  @Throws(JSONException::class)
  fun getBundledAssets(): JSONArray? = json.optJSONArray("bundledAssets")

  open fun getAssetUrlOverride(): String? = if (json.has("assetUrlOverride")) {
    json.optString("assetUrlOverride")
  } else {
    null
  }
}
