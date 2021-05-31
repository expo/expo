package expo.modules.updatesinterface.manifest

import org.json.JSONException
import org.json.JSONObject

class BareRawManifest(json: JSONObject) : BaseLegacyRawManifest(json) {
  @Throws(JSONException::class)
  fun getCommitTimeLong(): Long = json.getLong("commitTime")
}
