package expo.modules.manifests.core

import expo.modules.jsonutils.getOrNull
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class BaseLegacyManifest(json: JSONObject) : Manifest(json) {
  override fun getStableLegacyID(): String = json.getOrNull("originalFullName") ?: getLegacyID()

  override fun getScopeKey(): String = json.getOrNull("scopeKey") ?: getStableLegacyID()

  override fun getEASProjectID(): String? = json.getOrNull("projectId")

  fun getMetadata(): JSONObject? = json.getOrNull("metadata")

  override fun getAssets(): JSONArray? = json.getOrNull("assets")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = json.require("bundleUrl")

  override fun getSDKVersionNullable(): String? = json.getOrNull("sdkVersion")

  @Throws(JSONException::class)
  override fun getSDKVersion(): String = json.require("sdkVersion")

  override fun getExpoGoConfigRootObject(): JSONObject? {
    return json
  }

  override fun getExpoClientConfigRootObject(): JSONObject? {
    return json
  }

  override fun getSlug(): String? = json.getOrNull("slug")

  override fun getAppKey(): String? = json.getOrNull("appKey")

  fun getCommitTime(): String? = json.getOrNull("commitTime")

  @Throws(JSONException::class)
  private fun getPublishedTime(): String = json.require("publishedTime")

  override fun getSortTime(): String? {
    // use commitTime instead of publishedTime as it is more accurate;
    // however, fall back to publishedTime in case older cached manifests do not contain
    // the commitTime key (we have not always served it)
    return getCommitTime() ?: getPublishedTime()
  }
}
