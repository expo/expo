package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

abstract class RawManifest(protected val json: JSONObject) {
  @Deprecated(message = "Prefer to use specific field getters")
  fun getRawJson(): JSONObject = json

  @Throws(JSONException::class)
  fun getID(): String = json.getString("id")

  // this will need to be updated for new manifests
  @Throws(JSONException::class)
  fun getBundleURL(): String = json.getString("bundleUrl")

  @Throws(JSONException::class)
  fun getRevisionId(): String = json.getString("revisionId")

  // this will need to be overridden in NewManifest once sdkVersion can be parsed from sdkVersion
  fun getSDKVersionNullable(): String? = if (json.has("sdkVersion")) {
    json.optString("sdkVersion")
  } else {
    null
  }

  @Throws(JSONException::class)
  fun getSDKVersion(): String = json.getString("sdkVersion")

  abstract fun getAssets(): JSONArray?

  fun isDevelopmentMode(): Boolean {
    return try {
      json.has("developer") &&
          json.has("packagerOpts") &&
          json.getJSONObject("packagerOpts").optBoolean("dev", false)
    } catch (e: JSONException) {
      false
    }
  }

  fun isDevelopmentSilentLaunch(): Boolean {
    return try {
      json.has("developmentClient") &&
          json.getJSONObject("developmentClient")
            .optBoolean("silentLaunch", false)
    } catch (e: JSONException) {
      false
    }
  }

  fun isUsingDeveloperTool(): Boolean {
    return try {
      json.has("developer") && json.getJSONObject("developer").has("tool")
    } catch (e: JSONException) {
      false
    }
  }

  fun getSlug(): String? = if (json.has("slug")) {
    json.optString("slug")
  } else {
    null
  }

  fun getDebuggerHost(): String = json.optString("debuggerHost")
  fun getMainModuleName(): String = json.optString("mainModuleName")

  fun isVerified(): Boolean = json.optBoolean("isVerified")

  fun getAppKey(): String? = if (json.has("appKey")) {
    json.optString("appKey")
  } else {
    null
  }

  fun getName(): String? = if (json.has("name")) {
    json.optString("name")
  } else {
    null
  }

  fun getUpdatesInfo(): JSONObject? = json.optJSONObject("updates")

  fun getCommitTime(): String? = if (json.has("commitTime")) {
    json.optString("commitTime")
  } else {
    null
  }

  @Throws(JSONException::class)
  fun getPublishedTime(): String = json.getString("publishedTime")

  fun getPrimaryColor(): String? = if (json.has("primaryColor")) {
    json.optString("primaryColor")
  } else {
    null
  }

  fun getOrientation(): String? = if (json.has("orientation")) {
    json.optString("orientation")
  } else {
    null
  }

  fun getAndroidKeyboardLayoutMode(): String? {
    val android = json.optJSONObject("android") ?: return null
    return android.optString("softwareKeyboardLayoutMode") ?: return null
  }

  fun getAndroidUserInterfaceStyle(): String? {
    val android = json.optJSONObject("android") ?: return null
    return android.optString("userInterfaceStyle") ?: return null
  }

  fun getAndroidStatusBarOptions(): JSONObject? {
    return json.optJSONObject("androidStatusBar")
  }

  fun getAndroidBackgroundColor(): String? {
    return try {
      json.getJSONObject("android").getString("backgroundColor")
    } catch (e: JSONException) {
      json.optString("backgroundColor")
    }
  }

  fun getAndroidNavigationBarOptions(): JSONObject? {
    return json.optJSONObject("androidNavigationBar")
  }

  fun getIconUrl(): String? {
    return json.optString("iconUrl")
  }

  fun getNotificationPreferences(): JSONObject? {
    return json.optJSONObject("notification")
  }
}
