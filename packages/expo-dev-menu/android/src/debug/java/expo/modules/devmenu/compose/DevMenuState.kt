package expo.modules.devmenu.compose

import expo.modules.core.utilities.VRUtilities
import expo.modules.devmenu.DevToolsSettings
import org.json.JSONObject

data class DevMenuState(
  val appInfo: AppInfo? = null,
  val isOpen: Boolean = false,
  val devToolsSettings: DevToolsSettings = DevToolsSettings(),
  val isOnboardingFinished: Boolean = false,
  val showFab: Boolean = VRUtilities.isQuest(),
  val customItems: List<CustomItem> = emptyList(),
  val availableAppKeys: List<String> = emptyList(),
  val currentAppKey: String? = null,
  val openSubScreen: SubScreen? = null,
  val hasGoHomeAction: Boolean = false,
  val isInPictureInPictureMode: Boolean = false
) {
  /** Sub-screens the bottom sheet can drill into in place of the main menu. */
  enum class SubScreen {
    Components
  }

  data class CustomItem(
    val name: String,
    val shouldCollapse: Boolean,
    internal val fn: () -> Unit
  )

  data class AppInfo(
    val appName: String,
    val hostUrl: String,
    val appVersion: String? = null,
    val runtimeVersion: String? = null,
    val sdkVersion: String? = null,
    val engine: String? = null,
    val currentComponentName: String? = null
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
