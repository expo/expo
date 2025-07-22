package expo.modules.devmenu.compose

import expo.modules.devmenu.DevToolsSettings
import org.json.JSONObject

data class DevMenuState(
  val appInfo: AppInfo? = null,
  val isOpen: Boolean = false,
  val devToolsSettings: DevToolsSettings = DevToolsSettings(),
  val isOnboardingFinished: Boolean = false
) {
  data class AppInfo(
    val appName: String,
    val hostUrl: String,
    val appVersion: String? = null,
    val runtimeVersion: String? = null,
    val sdkVersion: String? = null,
    val engine: String? = null
  ) {
    fun toJson(): String {
      return JSONObject().apply {
        put("appName", appName)
        put("hostUrl", hostUrl)
        put("appVersion", appVersion ?: JSONObject.NULL)
        put("runtimeVersion", runtimeVersion ?: JSONObject.NULL)
        put("sdkVersion", sdkVersion ?: JSONObject.NULL)
        put("engine", engine ?: JSONObject.NULL)
      }.toString(2)
    }
  }
}
