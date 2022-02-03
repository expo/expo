package expo.modules.manifests.core

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

open class LegacyManifest(json: JSONObject) : BaseLegacyManifest(json) {
  @Throws(JSONException::class)
  fun getBundleKey(): String? = json.getNullable("bundleKey")

  @Throws(JSONException::class)
  fun getReleaseId(): String = json.require("releaseId")

  fun getRuntimeVersion(): String? = json.getNullable("runtimeVersion")

  @Throws(JSONException::class)
  fun getBundledAssets(): JSONArray? = json.getNullable("bundledAssets")

  open fun getAssetUrlOverride(): String? = json.getNullable("assetUrlOverride")
}
