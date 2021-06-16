package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class BaseLegacyRawManifest(json: JSONObject) : RawManifest(json) {
  override fun getStableLegacyID(): String = if (json.has("originalFullName")) {
    json.getString("originalFullName")
  } else {
    getLegacyID()
  }

  override fun getScopeKey(): String = if (json.has("scopeKey")) {
    json.getString("scopeKey")
  } else {
    getStableLegacyID()
  }

  override fun getProjectID(): String? = if (json.has("projectId")) {
    json.optString("projectId")
  } else {
    null
  }

  fun getMetadata(): JSONObject? = json.optJSONObject("metadata")
  override fun getAssets(): JSONArray? = json.optJSONArray("assets")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = json.getString("bundleUrl")

  override fun getSDKVersionNullable(): String? = if (json.has("sdkVersion")) {
    json.optString("sdkVersion")
  } else {
    null
  }

  @Throws(JSONException::class)
  override fun getSDKVersion(): String = json.getString("sdkVersion")
}
