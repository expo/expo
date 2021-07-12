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
   * A stable immutable scoping key for this experience. Should be used for scoping data that
   * does not need to make calls externally with the legacy ID.
   */
  @Throws(JSONException::class)
  abstract fun getScopeKey(): String

  /**
   * A stable UUID for this Expo project. Should be used to call Expo APIs where possible.
   */
  abstract fun getProjectID(): String?

  /**
   * The legacy ID of this experience.
   * - For Bare manifests, formatted as a UUID.
   * - For Legacy manifests, formatted as @owner/slug. Not stable through project transfers.
   * - For New manifests, currently incorrect value is UUID.
   *
   * Use this in cases where an identifier of the current manifest is needed (experience loading for example).
   * Use getScopeKey for cases where a stable key is needed to scope data to this experience.
   * Use getProjectID for cases where a stable UUID identifier of the experience is needed to identify over APIs.
   * Use getStableLegacyID for cases where a stable legacy format identifier of the experience is needed (experience scoping for example).
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

  abstract fun getExpoGoConfigRootObject(): JSONObject?
  abstract fun getExpoClientConfigRootObject(): JSONObject?

  fun isDevelopmentMode(): Boolean {
    val expoGoRootObject = getExpoGoConfigRootObject() ?: return false
    return try {
      expoGoRootObject.has("developer") &&
              expoGoRootObject.has("packagerOpts") &&
              expoGoRootObject.getJSONObject("packagerOpts").optBoolean("dev", false)
    } catch (e: JSONException) {
      false
    }
  }

  fun isDevelopmentSilentLaunch(): Boolean {
    val expoGoRootObject = getExpoGoConfigRootObject() ?: return false
    return try {
      expoGoRootObject.has("developmentClient") &&
              expoGoRootObject.getJSONObject("developmentClient").optBoolean("silentLaunch", false)
    } catch (e: JSONException) {
      false
    }
  }

  fun isUsingDeveloperTool(): Boolean {
    val expoGoRootObject = getExpoGoConfigRootObject() ?: return false
    return try {
      expoGoRootObject.has("developer") && expoGoRootObject.getJSONObject(
        "developer"
      ).has("tool")
    } catch (e: JSONException) {
      false
    }
  }

  abstract fun getSlug(): String?

  fun getDebuggerHost(): String = getExpoGoConfigRootObject()!!.getString("debuggerHost")
  fun getMainModuleName(): String = getExpoGoConfigRootObject()!!.getString("mainModuleName")

  fun isVerified(): Boolean = json.optBoolean("isVerified")

  abstract fun getAppKey(): String?

  fun getName(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optString("name")
  }

  fun getUpdatesInfo(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optJSONObject("updates")
  }

  abstract fun getSortTime(): String?

  fun getPrimaryColor(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optString("primaryColor")
  }

  fun getOrientation(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optString("orientation")
  }

  fun getAndroidKeyboardLayoutMode(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    val android = expoClientConfig.optJSONObject("android") ?: return null
    return android.optString("softwareKeyboardLayoutMode")
  }

  fun getAndroidUserInterfaceStyle(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    val android = expoClientConfig.optJSONObject("android") ?: return null
    return android.optString("userInterfaceStyle")
  }

  fun getAndroidStatusBarOptions(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optJSONObject("androidStatusBar")
  }

  fun getAndroidBackgroundColor(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return try {
      expoClientConfig.getJSONObject("android").getString("backgroundColor")
    } catch (e: JSONException) {
      expoClientConfig.optString("backgroundColor")
    }
  }

  fun getAndroidNavigationBarOptions(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optJSONObject("androidNavigationBar")
  }

  fun getAndroidJsEngine(): String? {
    val android = json.optJSONObject("android") ?: return null
    return android.optString("jsEngine") ?: return null
  }

  fun getIconUrl(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optString("iconUrl")
  }

  fun getNotificationPreferences(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optJSONObject("notification")
  }

  fun getAndroidSplashInfo(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optJSONObject("android")?.optJSONObject("splash")
  }

  fun getRootSplashInfo(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.optJSONObject("splash")
  }

  fun getAndroidGoogleServicesFile(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    val android = expoClientConfig.optJSONObject("android") ?: return null
    return android.optString("googleServicesFile")
  }

  fun getAndroidPackageName(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    val android = expoClientConfig.optJSONObject("android") ?: return null
    return android.optString("packageName")
  }

  @Throws(JSONException::class)
  fun getFacebookAppId(): String = getExpoClientConfigRootObject()!!.getString("facebookAppId")

  @Throws(JSONException::class)
  fun getFacebookApplicationName(): String = getExpoClientConfigRootObject()!!.getString("facebookDisplayName")

  @Throws(JSONException::class)
  fun getFacebookAutoInitEnabled(): Boolean = getExpoClientConfigRootObject()!!.getBoolean("facebookAutoInitEnabled")
}
