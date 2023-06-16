package expo.modules.manifests.core

import expo.modules.jsonutils.require
import org.json.JSONException
import org.json.JSONObject

data class BareManifest(private val json: JSONObject) : BaseLegacyManifest {
  override fun getRawJson(): JSONObject {
    return json
  }

  @Deprecated(message = "Prefer to use specific field getters")
  override fun toString(): String {
    return getRawJson().toString()
  }

  /**
   * A UUID for this manifest.
   */
  @Throws(JSONException::class)
  fun getID(): String = json.require("id")

  @Throws(JSONException::class)
  fun getCommitTimeLong(): Long = json.require("commitTime")
}
