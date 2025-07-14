package expo.modules.devmenu.compose

data class DevMenuState(
  val appInfo: AppInfo? = null,
  val isOpen: Boolean = false
) {
  data class AppInfo(
    val appName: String,
    val hostUrl: String,
    val appVersion: String? = null,
    val runtimeVersion: String? = null,
    val sdkVersion: String? = null,
    val engine: String? = null
  )
}
