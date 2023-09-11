package expo.modules.manifests.core

import expo.modules.jsonutils.getNullable
import expo.modules.jsonutils.require
import org.json.JSONArray
import org.json.JSONException
import org.json.JSONObject

interface InternalJSONMutator {
  @Throws(JSONException::class)
  fun updateJSON(json: JSONObject)
}

abstract class Manifest(protected val json: JSONObject) {
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
   * A best-effort immutable legacy ID for this experience. Stable through project transfers.
   * Should be used for calling Expo and EAS APIs during their transition to projectId.
   */
  @Deprecated(message = "Prefer scopeKey or projectId depending on use case")
  abstract fun getStableLegacyID(): String?

  /**
   * A stable immutable scoping key for this experience. Should be used for scoping data on the
   * client for this project when running in Expo Go.
   */
  @Throws(JSONException::class)
  abstract fun getScopeKey(): String

  /**
   * A stable UUID for this EAS project. Should be used to call EAS APIs.
   */
  abstract fun getEASProjectID(): String?

  /**
   * The legacy ID of this experience.
   * - For Bare manifests, formatted as a UUID.
   * - For Legacy manifests, formatted as @owner/slug. Not stable through project transfers.
   * - For New manifests, currently incorrect value is UUID.
   *
   * Use this in cases where an identifier of the current manifest is needed (experience loading for example).
   * Use getScopeKey for cases where a stable key is needed to scope data to this experience.
   * Use getEASProjectID for cases where a stable UUID identifier of the experience is needed to identify over EAS APIs.
   * Use getStableLegacyID for cases where a stable legacy format identifier of the experience is needed (experience scoping for example).
   */
  @Throws(JSONException::class)
  @Deprecated(message = "Prefer scopeKey or projectId depending on use case")
  fun getLegacyID(): String = json.require("id")

  @Throws(JSONException::class)
  abstract fun getBundleURL(): String

  @Throws(JSONException::class)
  fun getRevisionId(): String = getExpoClientConfigRootObject()!!.require("revisionId")

  fun getMetadata(): JSONObject? = json.getNullable("metadata")

  /**
   * Get the SDK version that should be attempted to be used in Expo Go. If no SDK version can be
   * determined, returns null
   */
  abstract fun getExpoGoSDKVersion(): String?

  abstract fun getAssets(): JSONArray?

  abstract fun getExpoGoConfigRootObject(): JSONObject?
  abstract fun getExpoClientConfigRootObject(): JSONObject?

  fun isDevelopmentMode(): Boolean {
    val expoGoRootObject = getExpoGoConfigRootObject() ?: return false
    return try {
      expoGoRootObject.has("developer") &&
        expoGoRootObject.getNullable<JSONObject>("packagerOpts")?.getNullable("dev") ?: false
    } catch (e: JSONException) {
      false
    }
  }

  fun isDevelopmentSilentLaunch(): Boolean {
    val expoGoRootObject = getExpoGoConfigRootObject() ?: return false
    return expoGoRootObject.getNullable<JSONObject>("developmentClient")?.getNullable("silentLaunch") ?: false
  }

  fun isUsingDeveloperTool(): Boolean {
    val expoGoRootObject = getExpoGoConfigRootObject() ?: return false
    return expoGoRootObject.getNullable<JSONObject>("developer")?.has("tool") ?: false
  }

  abstract fun getSlug(): String?

  fun getDebuggerHost(): String = getExpoGoConfigRootObject()!!.require("debuggerHost")
  fun getMainModuleName(): String = getExpoGoConfigRootObject()!!.require("mainModuleName")
  fun getHostUri(): String? = getExpoClientConfigRootObject()?.getNullable("hostUri")

  fun isVerified(): Boolean = json.getNullable("isVerified") ?: false

  abstract fun getAppKey(): String?

  fun getName(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("name")
  }

  fun getVersion(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("version")
  }

  fun getUpdatesInfo(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("updates")
  }

  fun getPrimaryColor(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("primaryColor")
  }

  fun getOrientation(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("orientation")
  }

  fun getAndroidKeyboardLayoutMode(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    val android = expoClientConfig.getNullable<JSONObject>("android") ?: return null
    return android.getNullable("softwareKeyboardLayoutMode")
  }

  fun getAndroidUserInterfaceStyle(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return try {
      expoClientConfig.require<JSONObject>("android").require("userInterfaceStyle")
    } catch (e: JSONException) {
      expoClientConfig.getNullable("userInterfaceStyle")
    }
  }

  fun getAndroidStatusBarOptions(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("androidStatusBar")
  }

  fun getAndroidBackgroundColor(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return try {
      expoClientConfig.require<JSONObject>("android").require("backgroundColor")
    } catch (e: JSONException) {
      expoClientConfig.getNullable("backgroundColor")
    }
  }

  fun getAndroidNavigationBarOptions(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("androidNavigationBar")
  }

  val jsEngine: String by lazy {
    val expoClientConfig = getExpoClientConfigRootObject()
    var result = expoClientConfig
      ?.getNullable<JSONObject>("android")?.getNullable<String>("jsEngine") ?: expoClientConfig?.getNullable<String>("jsEngine")
    if (result == null) {
      val sdkVersionComponents = getExpoGoSDKVersion()?.split(".")
      val sdkMajorVersion = if (sdkVersionComponents?.size == 3) sdkVersionComponents[0].toIntOrNull() else 0
      result = if (sdkMajorVersion in 1..47) "jsc" else "hermes"
    }
    result
  }

  fun getIconUrl(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("iconUrl")
  }

  fun getNotificationPreferences(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("notification")
  }

  fun getAndroidSplashInfo(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable<JSONObject>("android")?.getNullable("splash")
  }

  fun getRootSplashInfo(): JSONObject? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    return expoClientConfig.getNullable("splash")
  }

  fun getAndroidGoogleServicesFile(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    val android = expoClientConfig.getNullable<JSONObject>("android") ?: return null
    return android.getNullable("googleServicesFile")
  }

  fun getAndroidPackageName(): String? {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return null
    val android = expoClientConfig.getNullable<JSONObject>("android") ?: return null
    return android.getNullable("packageName")
  }

  fun shouldUseNextNotificationsApi(): Boolean {
    val expoClientConfig = getExpoClientConfigRootObject() ?: return false
    val android: JSONObject = expoClientConfig.getNullable<JSONObject>("android") ?: return false
    return android.getNullable("useNextNotificationsApi") ?: false
  }

  @Throws(JSONException::class)
  fun getFacebookAppId(): String = getExpoClientConfigRootObject()!!.require("facebookAppId")

  @Throws(JSONException::class)
  fun getFacebookApplicationName(): String = getExpoClientConfigRootObject()!!.require("facebookDisplayName")

  @Throws(JSONException::class)
  fun getFacebookAutoInitEnabled(): Boolean = getExpoClientConfigRootObject()!!.require("facebookAutoInitEnabled")

  /**
   * Queries the dedicated package properties in `plugins`
   */
  @Throws(JSONException::class, IllegalArgumentException::class)
  fun getPluginProperties(packageName: String): Map<String, Any>? {
    val pluginsRawValue = getExpoClientConfigRootObject()?.getNullable<JSONArray>("plugins") ?: return null
    val plugins = PluginType.fromRawArrayValue(pluginsRawValue) ?: return null
    return plugins.filterIsInstance<PluginType.WithProps>()
      .firstOrNull { it.plugin.first == packageName }
      ?.plugin?.second
  }

  companion object {
    @JvmStatic fun fromManifestJson(manifestJson: JSONObject): Manifest {
      return when {
        manifestJson.has("releaseId") -> {
          LegacyManifest(manifestJson)
        }
        manifestJson.has("metadata") -> {
          NewManifest(manifestJson)
        }
        else -> {
          BareManifest(manifestJson)
        }
      }
    }
  }
}

internal typealias PluginWithProps = Pair<String, Map<String, Any>>
internal typealias PluginWithoutProps = String
internal sealed class PluginType {
  data class WithProps(val plugin: PluginWithProps) : PluginType()
  data class WithoutProps(val plugin: PluginWithoutProps) : PluginType()

  companion object {
    @Throws(IllegalArgumentException::class)
    private fun fromRawValue(value: Any): PluginType? {
      return when (value) {
        is JSONArray -> {
          if (value.length() == 0) {
            throw IllegalArgumentException("Value for (key = plugins) has incorrect type")
          }
          val name = value.get(0) as? String ?: return null
          when (value.length()) {
            2 -> {
              val props = value.get(1) as? JSONObject ?: return null
              WithProps(name to props.toMap())
            }
            else -> {
              WithoutProps(name)
            }
          }
        }
        is String -> {
          WithoutProps(value)
        }
        else -> throw IllegalArgumentException("Value for (key = plugins) has incorrect type")
      }
    }

    @Throws(IllegalArgumentException::class)
    fun fromRawArrayValue(value: JSONArray): List<PluginType> {
      return mutableListOf<PluginType>().apply {
        for (i in 0 until value.length()) {
          fromRawValue(value.get(i))?.let {
            add(it)
          }
        }
      }
    }
  }
}
