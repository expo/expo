package expo.modules.observe.shared

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import expo.modules.observe.BuildConfig
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.util.Locale

/**
 * Provides app and device metadata from the Expo manifest for tagging sessions.
 */
internal object AppMetadataProvider {
  fun getAppMetadata(manifest: String?, context: Context): AppMetadata? {
    val parsedManifest = parseManifest(manifest) ?: return null
    return createMetadata(parsedManifest, context)
  }

  private fun parseManifest(manifest: String?): JsonObject? {
    if (manifest == null) {
      return null
    }
    val rawManifest = runCatching {
      Json.parseToJsonElement(manifest) as? JsonObject
    }.onFailure { Log.d(TAG, "Failed to parse manifest", it) }
      .getOrNull()

    return rawManifest
  }

  private fun createMetadata(manifest: JsonObject, context: Context): AppMetadata {
    val packageInfo = getPackageInfo(context)

    return AppMetadata(
      appName = context.applicationInfo.loadLabel(context.packageManager).toString(),
      appIdentifier = context.packageName,
      appVersion = packageInfo.versionName,
      appBuildNumber = getAppBuildNumber(packageInfo),
      appUpdatesInfo = AppMetrics.host.updatesInfo(),
      appEasBuildId = BuildConfig.EXPO_EAS_BUILD_ID,
      languageTag = Locale.getDefault().getLanguageTag(),
      deviceOs = DEVICE_OS,
      deviceOsVersion = Build.VERSION.RELEASE,
      deviceModel = getModelName(),
      deviceName = Build.DEVICE,
      expoSdkVersion = BuildConfig.EXPO_SDK_VERSION,
      reactNativeVersion = BuildConfig.REACT_NATIVE_VERSION,
      clientVersion = BuildConfig.EXPO_OBSERVE_VERSION
    )
  }
}

internal fun getPackageInfo(context: Context): PackageInfo {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    return context.packageManager.getPackageInfo(
      context.packageName,
      PackageManager.PackageInfoFlags.of(0)
    )
  }
  @Suppress("DEPRECATION")
  return context.packageManager.getPackageInfo(context.packageName, 0)
}

internal fun getAppBuildNumber(packageInfo: PackageInfo): String =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    packageInfo.longVersionCode.toString()
  } else {
    @Suppress("DEPRECATION")
    packageInfo.versionCode.toString()
  }

internal fun getModelName(): String {
  val manufacturer = Build.MANUFACTURER
  val model = Build.MODEL
  return if (model.startsWith(manufacturer)) {
    model
  } else {
    "$manufacturer $model"
  }
}

internal fun Locale.getLanguageTag(): String =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    stripExtensions().toLanguageTag()
  } else {
    Locale
      .Builder()
      .setLanguage(this.language)
      .setRegion(this.country)
      .setVariant(this.variant)
      .setScript(this.script)
      .build()
      .toLanguageTag()
  }
