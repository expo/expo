package expo.modules.updates.manifest.raw

import org.json.JSONException
import org.json.JSONObject

class BareRawManifest(json: JSONObject) : BaseLegacyRawManifest(json) {
  @Throws(JSONException::class)
  fun getCommitTimeLong(): Long = json.getLong("commitTime")
}
