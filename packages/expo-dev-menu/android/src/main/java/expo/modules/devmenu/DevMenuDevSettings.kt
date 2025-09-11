package expo.modules.devmenu

import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate

data class DevToolsSettings(
  val isElementInspectorShown: Boolean = false,
  val isHotLoadingEnabled: Boolean = true,
  val isPerfMonitorShown: Boolean = false
)

object DevMenuDevSettings {
  fun getDevSettings(reactHost: ReactHostWrapper): DevToolsSettings {
    val devDelegate = DevMenuDevToolsDelegate(DevMenuManager, reactHost)
    val devSettings = devDelegate.devSettings

    return DevToolsSettings(
      isElementInspectorShown = devSettings?.isElementInspectorEnabled ?: false,
      isHotLoadingEnabled = devSettings?.isHotModuleReplacementEnabled ?: true,
      isPerfMonitorShown = devSettings?.isFpsDebugEnabled ?: false
    )
  }
}
