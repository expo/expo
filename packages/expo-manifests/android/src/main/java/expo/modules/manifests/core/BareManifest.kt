package expo.modules.manifests.core

import expo.modules.jsonutils.require
import org.json.JSONException
import org.json.JSONObject

class BareManifest(json: JSONObject) : BaseLegacyManifest(json) {
  /**
   * A UUID for this manifest.
   */
  @Throws(JSONException::class)
  fun getID(): String = json.require("id")

  @Throws(JSONException::class)
  fun getCommitTimeLong(): Long = json.require("commitTime")
}
