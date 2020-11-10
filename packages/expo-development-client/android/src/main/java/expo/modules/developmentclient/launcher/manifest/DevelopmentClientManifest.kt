package expo.modules.developmentclient.launcher.manifest

data class DevelopmentClientAndroidManifestSection(
  val userInterfaceStyle: String?
)

data class DevelopmentClientManifest(
  val name: String,
  val slug: String,
  val bundleUrl: String,
  val hostUri: String,
  val mainModuleName: String,
  val logUrl: String,
  val orientation: String?,
  val android: DevelopmentClientAndroidManifestSection?
)
