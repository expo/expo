package expo.modules.updates

import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log

class UpdatesConfiguration {
  enum class CheckAutomaticallyConfiguration {
    NEVER, ERROR_RECOVERY_ONLY, WIFI_ONLY, ALWAYS
  }

  var isEnabled = false
    private set
  var expectsSignedManifest = false
    private set
  var scopeKey: String? = null
    private set
  var updateUrl: Uri? = null
    private set
  var sdkVersion: String? = null
    private set
  var runtimeVersion: String? = null
    private set
  var releaseChannel = UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE
    private set
  var launchWaitMs = UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_DEFAULT_VALUE
    private set
  var checkOnLaunch = CheckAutomaticallyConfiguration.ALWAYS
    private set
  var hasEmbeddedUpdate = true
  var requestHeaders = mapOf<String, String>()
    private set

  val isMissingRuntimeVersion: Boolean
    get() = (runtimeVersion == null || runtimeVersion!!.isEmpty()) &&
      (sdkVersion == null || sdkVersion!!.isEmpty())

  fun loadValuesFromMetadata(context: Context): UpdatesConfiguration {
    try {
      val ai = context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
      updateUrl = ai.metaData.getString("expo.modules.updates.EXPO_UPDATE_URL")?.let { Uri.parse(it) }
      scopeKey = ai.metaData.getString("expo.modules.updates.EXPO_SCOPE_KEY")
      maybeSetDefaultScopeKey()
      isEnabled = ai.metaData.getBoolean("expo.modules.updates.ENABLED", true)
      sdkVersion = ai.metaData.getString("expo.modules.updates.EXPO_SDK_VERSION")
      releaseChannel = ai.metaData.getString("expo.modules.updates.EXPO_RELEASE_CHANNEL", "default")
      launchWaitMs = ai.metaData.getInt("expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS", 0)
      runtimeVersion = ai.metaData["expo.modules.updates.EXPO_RUNTIME_VERSION"]?.toString()?.replaceFirst("^string:".toRegex(), "")

      val checkOnLaunchString = ai.metaData.getString("expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH", "ALWAYS")
      checkOnLaunch = try {
        CheckAutomaticallyConfiguration.valueOf(checkOnLaunchString)
      } catch (e: IllegalArgumentException) {
        Log.e(
          TAG,
          "Invalid value $checkOnLaunchString for expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH in AndroidManifest; defaulting to ALWAYS"
        )
        CheckAutomaticallyConfiguration.ALWAYS
      }

      requestHeaders = UpdatesUtils.getHeadersMapFromJSONString(
        ai.metaData.getString(
          "expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY",
          "{}"
        )
      )

      // used only for expo-updates development
      hasEmbeddedUpdate = ai.metaData.getBoolean("expo.modules.updates.HAS_EMBEDDED_UPDATE", true)
    } catch (e: Exception) {
      Log.e(TAG, "Could not read expo-updates configuration data in AndroidManifest", e)
    }
    return this
  }

  fun loadValuesFromMap(map: Map<String, Any>): UpdatesConfiguration {
    val isEnabledFromMap = map.readValueCheckingType<Boolean>(UPDATES_CONFIGURATION_ENABLED_KEY)
    if (isEnabledFromMap != null) {
      isEnabled = isEnabledFromMap
    }

    expectsSignedManifest = map.readValueCheckingType("expectsSignedManifest") ?: false

    val updateUrlFromMap = map.readValueCheckingType<Uri>(UPDATES_CONFIGURATION_UPDATE_URL_KEY)
    if (updateUrlFromMap != null) {
      updateUrl = updateUrlFromMap
    }

    val scopeKeyFromMap = map.readValueCheckingType<String>(UPDATES_CONFIGURATION_SCOPE_KEY_KEY)
    if (scopeKeyFromMap != null) {
      scopeKey = scopeKeyFromMap
    }
    maybeSetDefaultScopeKey()

    val requestHeadersFromMap = map.readValueCheckingType<Map<String, String>>(UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY)
    if (requestHeadersFromMap != null) {
      requestHeaders = requestHeadersFromMap
    }

    val releaseChannelFromMap = map.readValueCheckingType<String>(UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY)
    if (releaseChannelFromMap != null) {
      releaseChannel = releaseChannelFromMap
    }

    val sdkVersionFromMap = map.readValueCheckingType<String>(UPDATES_CONFIGURATION_SDK_VERSION_KEY)
    if (sdkVersionFromMap != null) {
      sdkVersion = sdkVersionFromMap
    }

    val runtimeVersionFromMap = map.readValueCheckingType<String>(UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY)
    if (runtimeVersionFromMap != null) {
      runtimeVersion = runtimeVersionFromMap
    }

    val checkOnLaunchFromMap = map.readValueCheckingType<String>(UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY)
    if (checkOnLaunchFromMap != null) {
      try {
        checkOnLaunch = CheckAutomaticallyConfiguration.valueOf(checkOnLaunchFromMap)
      } catch (e: IllegalArgumentException) {
        throw AssertionError("UpdatesConfiguration failed to initialize: invalid value $checkOnLaunchFromMap provided for checkOnLaunch")
      }
    }

    val launchWaitMsFromMap = map.readValueCheckingType<Int>(UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY)
    if (launchWaitMsFromMap != null) {
      launchWaitMs = launchWaitMsFromMap
    }

    val hasEmbeddedUpdateFromMap = map.readValueCheckingType<Boolean>(UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY)
    if (hasEmbeddedUpdateFromMap != null) {
      hasEmbeddedUpdate = hasEmbeddedUpdateFromMap
    }

    return this
  }

  private inline fun <reified T : Any> Map<String, Any>.readValueCheckingType(key: String): T? {
    if (!containsKey(key)) {
      return null
    }
    val value = this[key]
    return if (value is T) {
      value
    } else {
      throw AssertionError("UpdatesConfiguration failed to initialize: bad value of type " + value!!.javaClass.simpleName + " provided for key " + key)
    }
  }

  private fun maybeSetDefaultScopeKey() {
    // set updateUrl as the default value if none is provided
    if (scopeKey == null) {
      if (updateUrl != null) {
        scopeKey = getNormalizedUrlOrigin(updateUrl!!)
      }
    }
  }

  companion object {
    private val TAG = UpdatesConfiguration::class.java.simpleName

    const val UPDATES_CONFIGURATION_ENABLED_KEY = "enabled"
    const val UPDATES_CONFIGURATION_SCOPE_KEY_KEY = "scopeKey"
    const val UPDATES_CONFIGURATION_UPDATE_URL_KEY = "updateUrl"
    const val UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "requestHeaders"
    const val UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY = "releaseChannel"
    const val UPDATES_CONFIGURATION_SDK_VERSION_KEY = "sdkVersion"
    const val UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY = "runtimeVersion"
    const val UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY = "checkOnLaunch"
    const val UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY = "launchWaitMs"
    const val UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY = "hasEmbeddedUpdate"
    private const val UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE = "default"
    private const val UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_DEFAULT_VALUE = 0

    internal fun getNormalizedUrlOrigin(url: Uri): String {
      val scheme = url.scheme
      var port = url.port
      if (port == getDefaultPortForScheme(scheme)) {
        port = -1
      }
      return if (port > -1) "$scheme://${url.host}:$port" else "$scheme://${url.host}"
    }

    private fun getDefaultPortForScheme(scheme: String?): Int {
      if ("http" == scheme || "ws" == scheme) {
        return 80
      } else if ("https" == scheme || "wss" == scheme) {
        return 443
      } else if ("ftp" == scheme) {
        return 21
      }
      return -1
    }
  }
}
