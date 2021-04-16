package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class BaseLegacyRawManifest(json: JSONObject) : RawManifest(json) {
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
