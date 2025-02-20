package expo.modules.updates

import android.content.Context
import android.content.pm.PackageManager
import android.net.Uri
import android.util.Log
import expo.modules.core.errors.InvalidArgumentException
import expo.modules.updates.codesigning.CodeSigningConfiguration

enum class UpdatesConfigurationValidationResult {
  VALID,
  INVALID_NOT_ENABLED,
  INVALID_MISSING_URL,
  INVALID_MISSING_RUNTIME_VERSION
}

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
data class UpdatesConfiguration(
  val scopeKey: String,
  val updateUrl: Uri,
  val runtimeVersionRaw: String?,
  val launchWaitMs: Int,
  val checkOnLaunch: CheckAutomaticallyConfiguration,
  val hasEmbeddedUpdate: Boolean, // used only for expo-updates development
  val requestHeaders: Map<String, String>,
  val codeSigningCertificate: String?,
  val codeSigningMetadata: Map<String, String>?,
  val codeSigningIncludeManifestResponseCertificateChain: Boolean,
  private val codeSigningAllowUnsignedManifests: Boolean,
  val enableExpoUpdatesProtocolV0CompatibilityMode: Boolean, // used only in Expo Go to prevent loading rollbacks and other directives, which don't make much sense in the context of Expo Go
  val disableAntiBrickingMeasures: Boolean
) {
  enum class CheckAutomaticallyConfiguration {
    NEVER {
      override fun toJSString() = "NEVER"
    },
    ERROR_RECOVERY_ONLY {
      override fun toJSString() = "ERROR_RECOVERY_ONLY"
    },
    WIFI_ONLY {
      override fun toJSString() = "WIFI_ONLY"
    },
    ALWAYS {
      override fun toJSString() = "ALWAYS"
    };

    open fun toJSString(): String {
      throw InvalidArgumentException("Unsupported CheckAutomaticallyConfiguration value")
    }
  }

  constructor(
    context: Context?,
    overrideMap: Map<String, Any>?
  ) : this(
    context,
    overrideMap,
    disableAntiBrickingMeasures = getDisableAntiBrickingMeasures(context, overrideMap),
    configOverride = context?.let { UpdatesConfigurationOverride.load(context) }
  )

  internal constructor(
    context: Context?,
    overrideMap: Map<String, Any>?,
    disableAntiBrickingMeasures: Boolean,
    configOverride: UpdatesConfigurationOverride?
  ) : this(
    scopeKey = maybeGetDefaultScopeKey(
      overrideMap?.readValueCheckingType<String>(UPDATES_CONFIGURATION_SCOPE_KEY_KEY) ?: context?.getMetadataValue("expo.modules.updates.EXPO_SCOPE_KEY"),
      updateUrl = getUpdateUrl(context, overrideMap, disableAntiBrickingMeasures, configOverride)!!
    ),
    updateUrl = getUpdateUrl(context, overrideMap, disableAntiBrickingMeasures, configOverride)!!,
    runtimeVersionRaw = getRuntimeVersion(context, overrideMap),
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
    hasEmbeddedUpdate = getHasEmbeddedUpdate(context, overrideMap, disableAntiBrickingMeasures, configOverride),
    requestHeaders = getRequestHeaders(context, overrideMap, disableAntiBrickingMeasures, configOverride),
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
    enableExpoUpdatesProtocolV0CompatibilityMode = overrideMap?.readValueCheckingType<Boolean>(UPDATES_CONFIGURATION_ENABLE_EXPO_UPDATES_PROTOCOL_V0_COMPATIBILITY_MODE) ?: context?.getMetadataValue("expo.modules.updates.ENABLE_EXPO_UPDATES_PROTOCOL_V0_COMPATIBILITY_MODE") ?: false,
    disableAntiBrickingMeasures = getDisableAntiBrickingMeasures(context, overrideMap)
  )

  val codeSigningConfiguration: CodeSigningConfiguration? by lazy {
    codeSigningCertificate?.let {
      CodeSigningConfiguration(it, codeSigningMetadata, codeSigningIncludeManifestResponseCertificateChain, codeSigningAllowUnsignedManifests)
    }
  }

  fun getRuntimeVersion(): String {
    return if (!runtimeVersionRaw.isNullOrEmpty()) {
      runtimeVersionRaw
    } else {
      throw Exception("No runtime version provided in configuration")
    }
  }

  companion object {
    private val TAG = UpdatesConfiguration::class.java.simpleName

    const val UPDATES_CONFIGURATION_ENABLED_KEY = "enabled"
    const val UPDATES_CONFIGURATION_SCOPE_KEY_KEY = "scopeKey"
    const val UPDATES_CONFIGURATION_UPDATE_URL_KEY = "updateUrl"
    const val UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY = "requestHeaders"
    const val UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY = "runtimeVersion"
    const val UPDATES_CONFIGURATION_CHECK_ON_LAUNCH_KEY = "checkOnLaunch"
    const val UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_KEY = "launchWaitMs"
    const val UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY = "hasEmbeddedUpdate"
    const val UPDATES_CONFIGURATION_ENABLE_EXPO_UPDATES_PROTOCOL_V0_COMPATIBILITY_MODE = "enableExpoUpdatesProtocolCompatibilityMode"
    const val UPDATES_CONFIGURATION_DISABLE_ANTI_BRICKING_MEASURES = "disableAntiBrickingMeasures"

    const val UPDATES_CONFIGURATION_CODE_SIGNING_CERTIFICATE = "codeSigningCertificate"
    const val UPDATES_CONFIGURATION_CODE_SIGNING_METADATA = "codeSigningMetadata"
    const val UPDATES_CONFIGURATION_CODE_SIGNING_INCLUDE_MANIFEST_RESPONSE_CERTIFICATE_CHAIN = "codeSigningIncludeManifestResponseCertificateChain"
    const val UPDATES_CONFIGURATION_CODE_SIGNING_ALLOW_UNSIGNED_MANIFESTS = "codeSigningAllowUnsignedManifests"

    private const val UPDATES_CONFIGURATION_LAUNCH_WAIT_MS_DEFAULT_VALUE = 0

    const val UPDATES_CONFIGURATION_RUNTIME_VERSION_READ_FINGERPRINT_FILE_SENTINEL = "file:fingerprint"
    private const val FINGERPRINT_FILE_NAME = "fingerprint"

    private fun getDisableAntiBrickingMeasures(context: Context?, overrideMap: Map<String, Any>?): Boolean {
      return overrideMap?.readValueCheckingType<Boolean>(UPDATES_CONFIGURATION_DISABLE_ANTI_BRICKING_MEASURES) ?: context?.getMetadataValue("expo.modules.updates.DISABLE_ANTI_BRICKING_MEASURES") ?: false
    }

    private fun getHasEmbeddedUpdate(
      context: Context?,
      overrideMap: Map<String, Any>?,
      disableAntiBrickingMeasures: Boolean,
      configOverride: UpdatesConfigurationOverride?
    ): Boolean {
      if (disableAntiBrickingMeasures && configOverride != null) {
        return false
      }
      return overrideMap?.readValueCheckingType<Boolean>(UPDATES_CONFIGURATION_HAS_EMBEDDED_UPDATE_KEY)
        ?: context?.getMetadataValue("expo.modules.updates.HAS_EMBEDDED_UPDATE")
        ?: true
    }

    private fun getUpdateUrl(
      context: Context?,
      overrideMap: Map<String, Any>?,
      disableAntiBrickingMeasures: Boolean,
      configOverride: UpdatesConfigurationOverride?
    ): Uri? {
      if (disableAntiBrickingMeasures) {
        configOverride?.let {
          return it.updateUrl
        }
      }
      return overrideMap?.readValueCheckingType(UPDATES_CONFIGURATION_UPDATE_URL_KEY)
        ?: context?.getMetadataValue<String>("expo.modules.updates.EXPO_UPDATE_URL")
          ?.let { Uri.parse(it) }
    }

    private fun getRequestHeaders(
      context: Context?,
      overrideMap: Map<String, Any>?,
      disableAntiBrickingMeasures: Boolean,
      configOverride: UpdatesConfigurationOverride?
    ): Map<String, String> {
      if (disableAntiBrickingMeasures) {
        configOverride?.let {
          return it.requestHeaders
        }
      }
      return overrideMap?.readValueCheckingType<Map<String, String>>(UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY)
        ?: (context?.getMetadataValue<String>("expo.modules.updates.UPDATES_CONFIGURATION_REQUEST_HEADERS_KEY") ?: "{}").let {
          UpdatesUtils.getMapFromJSONString(it)
        }
    }

    private fun getIsEnabled(context: Context?, overrideMap: Map<String, Any>?): Boolean {
      return overrideMap?.readValueCheckingType(UPDATES_CONFIGURATION_ENABLED_KEY) ?: context?.getMetadataValue("expo.modules.updates.ENABLED") ?: true
    }

    private fun getRuntimeVersion(context: Context?, overrideMap: Map<String, Any>?): String? {
      val runtimeVersion = overrideMap?.readValueCheckingType(UPDATES_CONFIGURATION_RUNTIME_VERSION_KEY) ?: context?.getMetadataValue<Any>("expo.modules.updates.EXPO_RUNTIME_VERSION")?.toString()?.replaceFirst("^string:".toRegex(), "")

      if (context != null && runtimeVersion == UPDATES_CONFIGURATION_RUNTIME_VERSION_READ_FINGERPRINT_FILE_SENTINEL) {
        return context.assets.open(FINGERPRINT_FILE_NAME).use { stream ->
          stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
        }
      }

      return runtimeVersion
    }

    fun getUpdatesConfigurationValidationResult(context: Context?, overrideMap: Map<String, Any>?): UpdatesConfigurationValidationResult {
      val isEnabledConfigSetting = getIsEnabled(context, overrideMap)
      if (!isEnabledConfigSetting) {
        return UpdatesConfigurationValidationResult.INVALID_NOT_ENABLED
      }
      val disableAntiBrickingMeasures = getDisableAntiBrickingMeasures(context, overrideMap)
      val configOverride = if (context != null) UpdatesConfigurationOverride.load(context) else null
      getUpdateUrl(context, overrideMap, disableAntiBrickingMeasures, configOverride) ?: return UpdatesConfigurationValidationResult.INVALID_MISSING_URL

      if (getRuntimeVersion(context, overrideMap).isNullOrEmpty()) {
        return UpdatesConfigurationValidationResult.INVALID_MISSING_RUNTIME_VERSION
      }

      return UpdatesConfigurationValidationResult.VALID
    }
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
  return when (scheme) {
    "http", "ws" -> 80
    "https", "wss" -> 443
    "ftp" -> 21
    else -> -1
  }
}

internal fun getNormalizedUrlOrigin(url: Uri): String {
  val scheme = url.scheme
  var port = url.port
  if (port == getDefaultPortForScheme(scheme)) {
    port = -1
  }
  return if (port > -1) "$scheme://${url.host}:$port" else "$scheme://${url.host}"
}

private fun maybeGetDefaultScopeKey(scopeKey: String?, updateUrl: Uri): String {
  // set updateUrl as the default value if none is provided
  return scopeKey ?: getNormalizedUrlOrigin(updateUrl)
}
