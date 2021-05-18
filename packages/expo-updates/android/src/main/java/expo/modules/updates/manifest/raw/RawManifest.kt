package expo.modules.updates.manifest.raw

import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

interface InternalJSONMutator {
  @Throws(JSONException::class)
  fun updateJSON(json: JSONObject)
}

abstract class RawManifest(protected val json: JSONObject) {
  @Deprecated(message = "Strive for manifests to be immutable")
  @Throws(JSONException::class)
  fun mutateInternalJSONInPlace(internalJSONMutator: InternalJSONMutator) {
    json.apply {
      internalJSONMutator.updateJSON(this)
    }
  }

  @Deprecated(message = "Prefer to use specific field getters")
  fun getRawJson(): JSONObject = json

  @Deprecated(message = "Prefer to use specific field getters")
  override fun toString(): String {
    return getRawJson().toString()
  }

  /**
   * A best-effort immutable legacy ID for this experience. Formatted the same as getLegacyID.
   * Stable through project transfers.
   */
  @Throws(JSONException::class)
  abstract fun getStableLegacyID(): String

  /**
   * The legacy ID of this experience.
   * - For Bare manifests, formatted as a UUID.
   * - For Legacy manifests, formatted as @owner/slug. Not stable through project transfers.
   * - For New manifests, currently incorrect value is UUID.
   *
   * Use this in cases where an identifier of the current manifest is needed (experience loading for example).
   * Prefer getStableLegacyID for cases where a stable identifier of the experience is needed (experience scoping for example).
   */
  @Throws(JSONException::class)
  fun getLegacyID(): String = json.getString("id")

  @Throws(JSONException::class)
  abstract fun getBundleURL(): String

  @Throws(JSONException::class)
  fun getRevisionId(): String = json.getString("revisionId")

  abstract fun getSDKVersionNullable(): String?

  @Throws(JSONException::class)
  abstract fun getSDKVersion(): String

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

  fun getAndroidSplashInfo(): JSONObject? {
    return json.optJSONObject("android")?.optJSONObject("splash")
  }

  fun getRootSplashInfo(): JSONObject? {
    return json.optJSONObject("splash")
  }

  fun getAndroidGoogleServicesFile(): String? {
    val android = json.optJSONObject("android")
    return if (android != null && android.has("googleServicesFile")) {
      android.optString("googleServicesFile")
    } else {
      null
    }
  }

  fun getAndroidPackageName(): String? {
    val android = json.optJSONObject("android")
    return if (android != null && android.has("packageName")) {
      android.optString("packageName")
    } else {
      null
    }
  }

  @Throws(JSONException::class)
  fun getFacebookAppId(): String = json.getString("facebookAppId")

  @Throws(JSONException::class)
  fun getFacebookApplicationName(): String = json.getString("facebookDisplayName")

  @Throws(JSONException::class)
  fun getFacebookAutoInitEnabled(): Boolean = json.getBoolean("facebookAutoInitEnabled")
}
