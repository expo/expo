package expo.modules.appmetrics

import android.content.Context
import android.content.pm.PackageInfo
import android.content.pm.PackageManager
import android.os.Build
import android.util.Log
import expo.modules.interfaces.constants.ConstantsInterface
import expo.modules.updatesinterface.UpdatesControllerRegistry
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import java.util.Locale

/**
 * Provides app and device metadata from the Expo manifest for tagging sessions.
 */
public object AppMetadataProvider {
  fun getAppMetadata(constants: ConstantsInterface?, context: Context): AppMetadata? {
    val manifest = getManifest(constants) ?: return null
    return createMetadata(manifest, context)
  }

  private fun getManifest(constants: ConstantsInterface?): JsonObject? {
    val constantsMap = constants?.constants
    val manifestString = constantsMap?.get("manifest") ?: run {
      Log.d(TAG, "Manifest is null in ConstantsInterface")
      return null
    }
    val manifest = manifestString as? String ?: run {
      Log.d(TAG, "Manifest value is not a String")
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
      appUpdatesInfo = getAppUpdatesInfo(),
      appEasBuildId = BuildConfig.EXPO_EAS_BUILD_ID,
      languageTag = Locale.getDefault().getLanguageTag(),
      deviceOs = DEVICE_OS,
      deviceOsVersion = Build.VERSION.RELEASE,
      deviceModel = getModelName(),
      deviceName = Build.DEVICE,
      expoSdkVersion = BuildConfig.EXPO_SDK_VERSION,
      reactNativeVersion = BuildConfig.REACT_NATIVE_VERSION,
      clientVersion = BuildConfig.EXPO_APP_METRICS_VERSION
    )
  }
}

fun getPackageInfo(context: Context): PackageInfo {
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
    return context.packageManager.getPackageInfo(
      context.packageName,
      PackageManager.PackageInfoFlags.of(0)
    )
  }
  @Suppress("DEPRECATION")
  return context.packageManager.getPackageInfo(context.packageName, 0)
}

fun getAppBuildNumber(packageInfo: PackageInfo): String =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    packageInfo.longVersionCode.toString()
  } else {
    @Suppress("DEPRECATION")
    packageInfo.versionCode.toString()
  }

fun getAppUpdatesInfo(): AppUpdatesInfo {
  val controller = UpdatesControllerRegistry.controller?.get()
    ?: return AppUpdatesInfo(updateId = null, runtimeVersion = null, requestHeaders = null)
  val launchedUpdateId = controller.launchedUpdateId
  val embeddedUpdateId = controller.embeddedUpdateId
  // Ignore embedded launches – they are not available on the website anyway.
  val updateId = if (launchedUpdateId == embeddedUpdateId) null else launchedUpdateId?.toString()
  return AppUpdatesInfo(
    updateId = updateId,
    runtimeVersion = controller.runtimeVersion,
    requestHeaders = controller.requestHeaders
  )
}

fun getModelName(): String {
  val manufacturer = Build.MANUFACTURER
  val model = Build.MODEL
  return if (model.startsWith(manufacturer)) {
    model
  } else {
    "$manufacturer $model"
  }
}

fun Locale.getLanguageTag(): String =
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
