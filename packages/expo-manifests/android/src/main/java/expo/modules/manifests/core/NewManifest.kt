package expo.modules.manifests.core

import expo.modules.jsonutils.getOrNull
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.regex.Matcher
import java.util.regex.Pattern

class NewManifest(json: JSONObject) : Manifest(json) {
  /**
   * An ID representing this manifest, not the ID for the experience.
   */
  @Throws(JSONException::class)
  fun getID(): String = json.require("id")

  /**
   * Incorrect for now until we figure out how to get this in the new manifest format.
   */
  @Throws(JSONException::class)
  override fun getStableLegacyID(): String = getID()

  @Throws(JSONException::class)
  override fun getScopeKey(): String {
    return json.require<JSONObject>("extra").require("scopeKey")
  }

  override fun getEASProjectID(): String? {
    val easConfig = getExtra()?.getOrNull<JSONObject>("eas") ?: return null
    return easConfig.getOrNull("projectId")
  }

  @Throws(JSONException::class)
  fun getRuntimeVersion(): String = json.require("runtimeVersion")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = getLaunchAsset().require("url")

  override fun getSDKVersionNullable(): String? {
    val runtimeVersion = getRuntimeVersion()
    val expoSDKRuntimeVersionRegex: Pattern = Pattern.compile("^exposdk:(\\d+\\.\\d+\\.\\d+)$")
    val expoSDKRuntimeVersionMatch: Matcher = expoSDKRuntimeVersionRegex.matcher(runtimeVersion)
    if (expoSDKRuntimeVersionMatch.find()) {
      return expoSDKRuntimeVersionMatch.group(1)!!
    }
    return null
  }

  @Throws(JSONException::class)
  override fun getSDKVersion(): String {
    return getSDKVersionNullable()
      ?: throw JSONException("SDKVersion not found for runtimeVersion ${getRuntimeVersion()}")
  }

  @Throws(JSONException::class)
  fun getLaunchAsset(): JSONObject = json.require("launchAsset")

  override fun getAssets(): JSONArray? = json.getOrNull("assets")

  @Throws(JSONException::class)
  fun getCreatedAt(): String = json.require("createdAt")

  override fun getExpoGoConfigRootObject(): JSONObject? {
    return getExtra()?.getOrNull("expoGo")
  }

  override fun getExpoClientConfigRootObject(): JSONObject? {
    return getExtra()?.getOrNull("expoClient")
  }

  override fun getSlug(): String? = null

  override fun getAppKey(): String? = null

  override fun getSortTime(): String {
    return getCreatedAt()
  }

  private fun getExtra(): JSONObject? {
    return json.getOrNull("extra")
  }
}
