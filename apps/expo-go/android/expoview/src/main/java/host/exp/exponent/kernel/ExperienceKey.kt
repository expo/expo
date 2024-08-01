package host.exp.exponent.kernel

import expo.modules.manifests.core.Manifest
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
    @JvmStatic
    fun fromManifest(manifest: Manifest) = ExperienceKey(manifest.getScopeKey())
  }
}
