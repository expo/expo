package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONObject

abstract class BaseLegacyRawManifest(json: String) : RawManifest(json) {
  fun getMetadata(): JSONObject? = optJSONObject("metadata")
  override fun getAssets(): JSONArray? = optJSONArray("assets")
}
