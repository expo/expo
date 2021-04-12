package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class NewRawManifest(json: JSONObject) : RawManifest(json) {
  @Throws(JSONException::class)
  fun getRuntimeVersion(): String = json.getString("runtimeVersion")

  @Throws(JSONException::class)
  fun getLaunchAsset(): JSONObject = json.getJSONObject("launchAsset")

  override fun getAssets(): JSONArray? = json.optJSONArray("assets")

  @Throws(JSONException::class)
  fun getCreatedAt(): String = json.getString("createdAt")
}
