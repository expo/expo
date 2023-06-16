package expo.modules.manifests.core

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

data class LegacyManifest(private val json: JSONObject) : BaseLegacyManifest {
  override fun getRawJson(): JSONObject {
    return json
  }

  @Deprecated(message = "Prefer to use specific field getters")
  override fun toString(): String {
    return getRawJson().toString()
  }

  @Throws(JSONException::class)
  fun getBundleKey(): String? = json.getNullable("bundleKey")

  @Throws(JSONException::class)
  fun getReleaseId(): String = json.require("releaseId")

  fun getRuntimeVersion(): String? = json.getNullable("runtimeVersion")

  @Throws(JSONException::class)
  fun getBundledAssets(): JSONArray? = json.getNullable("bundledAssets")

  open fun getAssetUrlOverride(): String? = json.getNullable("assetUrlOverride")
}
