package expo.modules.updates

import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import expo.modules.updates.codesigning.CodeSigningConfiguration

/**
 * Holds global, immutable configuration values for updates, as well as doing some rudimentary
 * validation.
 *
 * In most apps, these configuration values are baked into the build, and this class functions as a
 * utility for reading and memoizing the values.
 *
 * In development clients (including Expo Go) where this configuration is intended to be dynamic at
 * runtime and updates from multiple scopes can potentially be opened, multiple instances of this
 * class may be created over the lifetime of the app, but only one should be active at a time.
 */
class UpdatesConfiguration private constructor (
  val isEnabled: Boolean,
  val expectsSignedManifest: Boolean,
  val scopeKey: String?,
  val updateUrl: Uri?,
  val sdkVersion: String?,
  val runtimeVersion: String?,
  val releaseChannel: String,
  val launchWaitMs: Int,
  val checkOnLaunch: CheckAutomaticallyConfiguration,
  val hasEmbeddedUpdate: Boolean, // used only for expo-updates development
  val requestHeaders: Map<String, String>,
  val codeSigningCertificate: String?,
  val codeSigningMetadata: Map<String, String>?,
  val codeSigningIncludeManifestResponseCertificateChain: Boolean,
  val codeSigningAllowUnsignedManifests: Boolean,
) {
  enum class CheckAutomaticallyConfiguration {
    NEVER, ERROR_RECOVERY_ONLY, WIFI_ONLY, ALWAYS
  }

  constructor(context: Context?, overrideMap: Map<String, Any>?) : this(
    isEnabled = overrideMap?.readValueCheckingType<Boolean>(UPDATES_CONFIGURATION_ENABLED_KEY) ?: context?.getMetadataValue("expo.modules.updates.ENABLED") ?: true,
    expectsSignedManifest = overrideMap?.readValueCheckingType(UPDATES_CONFIGURATION_EXPECTS_EXPO_SIGNED_MANIFEST) ?: false,
    scopeKey = maybeGetDefaultScopeKey(
      overrideMap?.readValueCheckingType<String>(UPDATES_CONFIGURATION_SCOPE_KEY_KEY) ?: context?.getMetadataValue("expo.modules.updates.EXPO_SCOPE_KEY"),
      updateUrl = overrideMap?.readValueCheckingType<Uri>(UPDATES_CONFIGURATION_UPDATE_URL_KEY) ?: context?.getMetadataValue<String>("expo.modules.updates.EXPO_UPDATE_URL")?.let { Uri.parse(it) },
    ),
    updateUrl = overrideMap?.readValueCheckingType<Uri>(UPDATES_CONFIGURATION_UPDATE_URL_KEY) ?: context?.getMetadataValue<String>("expo.modules.updates.EXPO_UPDATE_URL")?.let { Uri.parse(it) },
    sdkVersion = overrideMap?.readValueCheckingType<String>(UPDATES_CONFIGURATION_SDK_VERSION_KEY) ?: context?.getMetadataValue("expo.modules.updates.EXPO_SDK_VERSION"),
    runtimeVersion = overrideMap?.readValueCheckingType<String>(UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY) ?: context?.getMetadataValue<Any>("expo.modules.updates.EXPO_RUNTIME_VERSION")?.toString()?.replaceFirst("^string:".toRegex(), ""),
    releaseChannel = overrideMap?.readValueCheckingType<String>(UPDATES_CONFIGURATION_RELEASE_CHANNEL_KEY) ?: context?.getMetadataValue("expo.modules.updates.EXPO_RELEASE_CHANNEL") ?: UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE,
    launchWaitMs = overrideMap?.readValueCheckingType<Int>(UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY) ?: context?.getMetadataValue("expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS") ?: UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_DEFAULT_VALUE,
    checkOnLaunch = overrideMap?.readValueCheckingType<String>(UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY)?.let {
      try {
        CheckAutomaticallyConfiguration.valueOf(it)
      } catch (e: IllegalArgumentException) {
        throw AssertionError("UpdatesConfiguration failed to initialize: invalid value $it provided for checkOnLaunch")
      }
    } ?: (context?.getMetadataValue<String>("expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH") ?: "ALWAYS").let {
      try {
        CheckAutomaticallyConfiguration.valueOf(it)
      } catch (e: IllegalArgumentException) {
        Log.e(
          TAG,
          "Invalid value $it for expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH in AndroidManifest; defaulting to ALWAYS"
        )
        CheckAutomaticallyConfiguration.ALWAYS
      }
    },
    hasEmbeddedUpdate = overrideMap?.readValueCheckingType<Boolean>(UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY) ?: context?.getMetadataValue("expo.modules.updates.HAS_EMBEDDED_UPDATE") ?: true,
    requestHeaders = overrideMap?.readValueCheckingType<Map<String, String>>(UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY) ?: (context?.getMetadataValue<String>("expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY") ?: "{}").let {
      UpdatesUtils.getMapFromJSONString(it)
    },
    codeSigningCertificate = overrideMap?.readValueCheckingType<String>(UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE) ?: context?.getMetadataValue("expo.modules.updates.CODE_SIGNING_CERTIFICATE"),
    codeSigningMetadata = overrideMap?.readValueCheckingType<Map<String, String>>(UPDATES_CONFIGURATION_CODE_SIGNING_METADATA) ?: (context?.getMetadataValue<String>("expo.modules.updates.CODE_SIGNING_METADATA") ?: "{}").let {
      UpdatesUtils.getMapFromJSONString(it)
    },
    codeSigningIncludeManifestResponseCertificateChain = overrideMap?.readValueCheckingType<Boolean>(
      UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN
    ) ?: context?.getMetadataValue("expo.modules.updates.CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN") ?: false,
    codeSigningAllowUnsignedManifests = overrideMap?.readValueCheckingType<Boolean>(
      UPDATES_CONFIGURATION_CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS
    ) ?: context?.getMetadataValue("expo.modules.updates.CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS") ?: false,
  )

  val isMissingRuntimeVersion: Boolean
    get() = (runtimeVersion == null || runtimeVersion.isEmpty()) &&
      (sdkVersion == null || sdkVersion.isEmpty())

  val codeSigningConfiguration: CodeSigningConfiguration? by lazy {
    codeSigningCertificate?.let {
      CodeSigningConfiguration(it, codeSigningMetadata, codeSigningIncludeManifestResponseCertificateChain, codeSigningAllowUnsignedManifests)
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
    const val UPDATES_CONFIGURATION_EXPECTS_EXPO_SIGNED_MANIFEST = "expectsSignedManifest"

    const val UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE = "codeSigningCertificate"
    const val UPDATES_CONFIGURATION_CODE_SIGNING_METADATA = "codeSigningMetadata"
    const val UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN = "codeSigningIncludeManifestResponseCertificateChain"
    const val UPDATES_CONFIGURATION_CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS = "codeSigningAllowUnsignedManifests"

    private const val UPDATES_CONFIGURATION_RELEASE_CHANNEL_DEFAULT_VALUE = "default"
    private const val UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_DEFAULT_VALUE = 0
  }
}

private inline fun <reified T : Any> Context.getMetadataValue(key: String): T? {
  val ai = packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA).metaData
  if (!ai.containsKey(key)) {
    return null
  }
  return when (T::class) {
    String::class -> ai.getString(key) as T?
    Boolean::class -> ai.getBoolean(key) as T?
    Int::class -> ai.getInt(key) as T?
    else -> ai[key] as T?
  }
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

internal fun getNormalizedUrlOrigin(url: Uri): String {
  val scheme = url.scheme
  var port = url.port
  if (port == getDefaultPortForScheme(scheme)) {
    port = -1
  }
  return if (port > -1) "$scheme://${url.host}:$port" else "$scheme://${url.host}"
}

private fun maybeGetDefaultScopeKey(scopeKey: String?, updateUrl: Uri?): String? {
  // set updateUrl as the default value if none is provided
  if (scopeKey == null) {
    if (updateUrl != null) {
      return getNormalizedUrlOrigin(updateUrl)
    }
  }
  return scopeKey
}
