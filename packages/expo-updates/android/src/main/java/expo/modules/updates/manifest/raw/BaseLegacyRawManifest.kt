package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class BaseLegacyRawManifest(json: JSONObject) : RawManifest(json) {
  override fun getStableLegacyID(): String = if (json.has("originalFullName")) {
    json.getString("originalFullName")
  } else {
    getLegacyID()
  }

  override fun getScopeKey(): String = if (json.has("scopeKey")) {
    json.getString("scopeKey")
  } else {
    getStableLegacyID()
  }

  override fun getProjectID(): String? = if (json.has("projectId")) {
    json.optString("projectId")
  } else {
    null
  }

  fun getMetadata(): JSONObject? = json.optJSONObject("metadata")
  override fun getAssets(): JSONArray? = json.optJSONArray("assets")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = json.getString("bundleUrl")

  override fun getSDKVersionNullable(): String? = if (json.has("sdkVersion")) {
    json.optString("sdkVersion")
  } else {
    null
  }

  @Throws(JSONException::class)
  override fun getSDKVersion(): String = json.getString("sdkVersion")

  override fun getExpoGoConfigRootObject(): JSONObject? {
    return json
  }

  override fun getExpoClientConfigRootObject(): JSONObject? {
    return json
  }

  override fun getSlug(): String? = if (json.has("slug")) {
    json.optString("slug")
  } else {
    null
  }

  override fun getAppKey(): String? = if (json.has("appKey")) {
    json.optString("appKey")
  } else {
    null
  }

  fun getCommitTime(): String? = if (json.has("commitTime")) {
    json.optString("commitTime")
  } else {
    null
  }

  @Throws(JSONException::class)
  private fun getPublishedTime(): String = json.getString("publishedTime")

  override fun getSortTime(): String? {
    // use commitTime instead of publishedTime as it is more accurate;
    // however, fall back to publishedTime in case older cached manifests do not contain
    // the commitTime key (we have not always served it)
    return getCommitTime() ?: getPublishedTime()
  }
}
