package expo.modules.updates.manifest.raw

import org.json.JSONException

class BareRawManifest(json: String) : BaseLegacyRawManifest(json) {
  @Throws(JSONException::class)
  fun getCommitTime(): Long = getLong("commitTime")
}
