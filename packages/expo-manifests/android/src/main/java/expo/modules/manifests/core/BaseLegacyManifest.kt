package expo.modules.manifests.core

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class BaseLegacyManifest(json: JSONObject) : Manifest(json) {
  override fun getStableLegacyID(): String = json.getNullable("originalFullName") ?: getLegacyID()

  override fun getScopeKey(): String = json.getNullable("scopeKey") ?: getStableLegacyID()

  override fun getEASProjectID(): String? = json.getNullable("projectId")

  fun getMetadata(): JSONObject? = json.getNullable("metadata")

  override fun getAssets(): JSONArray? = json.getNullable("assets")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = json.require("bundleUrl")

  override fun getSDKVersion(): String? = json.getNullable("sdkVersion")

  override fun getExpoGoConfigRootObject(): JSONObject? {
    return json
  }

  override fun getExpoClientConfigRootObject(): JSONObject? {
    return json
  }

  override fun getSlug(): String? = json.getNullable("slug")

  override fun getAppKey(): String? = json.getNullable("appKey")

  fun getCommitTime(): String? = json.getNullable("commitTime")

  @Throws(JSONException::class)
  private fun getPublishedTime(): String = json.require("publishedTime")

  override fun getSortTime(): String? {
    // use commitTime instead of publishedTime as it is more accurate;
    // however, fall back to publishedTime in case older cached manifests do not contain
    // the commitTime key (we have not always served it)
    return getCommitTime() ?: getPublishedTime()
  }
}
