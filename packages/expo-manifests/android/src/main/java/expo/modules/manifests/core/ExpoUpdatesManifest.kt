package expo.modules.manifests.core

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

class ExpoUpdatesManifest(json: JSONObject) : Manifest(json) {
  /**
   * An ID representing this manifest, not the ID for the experience.
   */
  @Throws(JSONException::class)
  fun getID(): String = json.require("id")

  override fun getStableLegacyID(): String? = null

  @Throws(JSONException::class)
  override fun getScopeKey(): String {
    return json.require<JSONObject>("extra").require("scopeKey")
  }

  override fun getEASProjectID(): String? {
    val easConfig = getExtra()?.getNullable<JSONObject>("eas") ?: return null
    return easConfig.getNullable("projectId")
  }

  @Throws(JSONException::class)
  fun getRuntimeVersion(): String = json.require("runtimeVersion")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = getLaunchAsset().require("url")

  override fun getExpoGoSDKVersion(): String? {
    return getExpoClientConfigRootObject()?.getString("sdkVersion")
  }

  @Throws(JSONException::class)
  fun getLaunchAsset(): JSONObject = json.require("launchAsset")

  override fun getAssets(): JSONArray? = json.getNullable("assets")

  @Throws(JSONException::class)
  fun getCreatedAt(): String = json.require("createdAt")

  override fun getExpoGoConfigRootObject(): JSONObject? {
    return getExtra()?.getNullable("expoGo")
  }

  override fun getExpoClientConfigRootObject(): JSONObject? {
    return getExtra()?.getNullable("expoClient")
  }

  override fun getSlug(): String? = null

  override fun getAppKey(): String? = null

  private fun getExtra(): JSONObject? {
    return json.getNullable("extra")
  }
}
