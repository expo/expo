package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONObject

abstract class BaseLegacyRawManifest(json: JSONObject) : RawManifest(json) {
  fun getMetadata(): JSONObject? = json.optJSONObject("metadata")
  override fun getAssets(): JSONArray? = json.optJSONArray("assets")
}
