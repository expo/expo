package expo.modules.appmetrics

data class AppMetadata(
  val appName: String?,
  val appIdentifier: String,
  val appVersion: String?,
  val appBuildNumber: String?,
  val appUpdatesInfo: AppUpdatesInfo?,
  val appEasBuildId: String?,
  val languageTag: String?,
  val deviceOs: String?,
  val deviceOsVersion: String?,
  val deviceModel: String?,
  val deviceName: String?,
  val expoSdkVersion: String,
  val reactNativeVersion: String,
  val clientVersion: String?,
)

data class AppUpdatesInfo(
  val updateId: String?,
  val runtimeVersion: String?,
  val requestHeaders: Map<String, String>?
) {
  val channel: String?
    get() = requestHeaders?.get("expo-channel-name")
}
