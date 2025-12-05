package expo.modules.devmenu

import com.facebook.react.ReactHost
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.kotlin.weak

data class DevToolsSettings(
  val isElementInspectorShown: Boolean = false,
  val isHotLoadingEnabled: Boolean = true,
  val isPerfMonitorShown: Boolean = false
)

object DevMenuDevSettings {
  fun getDevSettings(reactHost: ReactHost): DevToolsSettings {
    val devDelegate = DevMenuDevToolsDelegate(requireNotNull(reactHost.devSupportManager).weak())
    val devSettings = devDelegate.devSettings

    return DevToolsSettings(
      isElementInspectorShown = devSettings?.isElementInspectorEnabled ?: false,
      isHotLoadingEnabled = devSettings?.isHotModuleReplacementEnabled ?: true,
      isPerfMonitorShown = devSettings?.isFpsDebugEnabled ?: false
    )
  }
}
