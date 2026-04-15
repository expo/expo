package expo.modules.appmetrics

data class AppMetadata(
  val appName: String?,
  val appIdentifier: String,
  val appVersion: String?,
  val appBuildNumber: String?,
  val appUpdateId: String?,
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
