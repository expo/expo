package expo.modules.manifests.core

import org.json.JSONException
import org.json.JSONObject

class BareManifest(json: JSONObject) : BaseLegacyManifest(json) {
  /**
   * A UUID for this manifest.
   */
  @Throws(JSONException::class)
  fun getID(): String = json.getString("id")

  @Throws(JSONException::class)
  fun getCommitTimeLong(): Long = json.getLong("commitTime")
}
