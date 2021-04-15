package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class RawManifest(json: String) : JSONObject(json) {
  @Throws(JSONException::class)
  fun getID(): String = getString("id")

  abstract fun getAssets(): JSONArray?
}
