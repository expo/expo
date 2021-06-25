package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class LegacyRawManifest(json: JSONObject) : BaseLegacyRawManifest(json) {
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

  fun getAssetUrlOverride(): String? = if (json.has("assetUrlOverride")) {
    json.optString("assetUrlOverride")
  } else {
    null
  }
}
