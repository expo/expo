package expo.modules.manifests.core

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

interface BaseLegacyManifest : Manifest {
  override fun getStableLegacyID(): String = getRawJson().getNullable("originalFullName") ?: getLegacyID()

  override fun getScopeKey(): String = getRawJson().getNullable("scopeKey") ?: getStableLegacyID()

  override fun getEASProjectID(): String? = getRawJson().getNullable("projectId")

  override fun getAssets(): JSONArray? = getRawJson().getNullable("assets")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = getRawJson().require("bundleUrl")

  override fun getExpoGoSDKVersion(): String? = getRawJson().getNullable("sdkVersion")

  override fun getExpoGoConfigRootObject(): JSONObject? {
    return getRawJson()
  }

  override fun getExpoClientConfigRootObject(): JSONObject? {
    return getRawJson()
  }

  override fun getSlug(): String? = getRawJson().getNullable("slug")

  override fun getAppKey(): String? = getRawJson().getNullable("appKey")

  fun getCommitTime(): String? = getRawJson().getNullable("commitTime")
}
