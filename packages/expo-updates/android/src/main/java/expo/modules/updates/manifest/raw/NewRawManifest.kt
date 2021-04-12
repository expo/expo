package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class NewRawManifest(json: String) : RawManifest(json) {
  @Throws(JSONException::class)
  fun getRuntimeVersion(): String = getString("runtimeVersion")

  @Throws(JSONException::class)
  fun getLaunchAsset(): JSONObject = getJSONObject("launchAsset")

  override fun getAssets(): JSONArray? = optJSONArray("assets")

  @Throws(JSONException::class)
  fun getCreatedAt(): String = getString("createdAt")
}
