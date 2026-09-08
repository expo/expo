package expo.modules.devmenu

import com.facebook.react.ReactHost
import expo.modules.devmenu.api.CustomPerformanceMonitor
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import expo.modules.kotlin.weak

data class DevToolsSettings(
  val isElementInspectorShown: Boolean = false,
  val isHotLoadingEnabled: Boolean = true,
  val isPerfMonitorShown: Boolean = false
)

object DevMenuDevSettings {
  fun getDevSettings(reactHost: ReactHost): DevToolsSettings {
    val devSupportManager = requireNotNull(reactHost.devSupportManager)
    val devDelegate = DevMenuDevToolsDelegate(devSupportManager.weak())
    val devSettings = devDelegate.devSettings

    return DevToolsSettings(
      isElementInspectorShown = devSettings?.isElementInspectorEnabled ?: false,
      isHotLoadingEnabled = devSettings?.isHotModuleReplacementEnabled ?: true,
      isPerfMonitorShown = (devSupportManager as? CustomPerformanceMonitor)?.isPerformanceMonitorShown
        ?: devSettings?.isFpsDebugEnabled
        ?: false
    )
  }
}
