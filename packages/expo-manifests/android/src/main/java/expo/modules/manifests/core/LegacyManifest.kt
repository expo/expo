package expo.modules.manifests.core

import expo.modules.jsonutils.getOrNull
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

open class LegacyManifest(json: JSONObject) : BaseLegacyManifest(json) {
  @Throws(JSONException::class)
  fun getBundleKey(): String? = json.getOrNull("bundleKey")

  @Throws(JSONException::class)
  fun getReleaseId(): String = json.require("releaseId")

  fun getRuntimeVersion(): String? = json.getOrNull("runtimeVersion")

  @Throws(JSONException::class)
  fun getBundledAssets(): JSONArray? = json.getOrNull("bundledAssets")

  open fun getAssetUrlOverride(): String? = json.getOrNull("assetUrlOverride")
}
