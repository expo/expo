package host.exp.exponent.kernel

import expo.modules.updates.manifest.raw.RawManifest
import org.json.JSONException
import java.io.UnsupportedEncodingException
import java.net.URLEncoder

data class ExperienceKey(
  val scopeKey: String
) {
  @Throws(UnsupportedEncodingException::class)
  fun getUrlEncodedScopeKey(): String = URLEncoder.encode(scopeKey, "UTF-8")

  companion object {
    @Throws(JSONException::class)
    @JvmStatic fun fromRawManifest(rawManifest: RawManifest) = ExperienceKey(rawManifest.getScopeKey())
  }
}
