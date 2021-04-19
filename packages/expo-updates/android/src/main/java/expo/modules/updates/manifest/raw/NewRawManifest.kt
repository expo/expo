package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject
import java.util.regex.Matcher
import java.util.regex.Pattern

class NewRawManifest(json: JSONObject) : RawManifest(json) {
  @Throws(JSONException::class)
  fun getRuntimeVersion(): String = json.getString("runtimeVersion")

  @Throws(JSONException::class)
  override fun getBundleURL(): String = getLaunchAsset().getString("url")

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
  fun getLaunchAsset(): JSONObject = json.getJSONObject("launchAsset")

  override fun getAssets(): JSONArray? = json.optJSONArray("assets")

  @Throws(JSONException::class)
  fun getCreatedAt(): String = json.getString("createdAt")
}
