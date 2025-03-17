package expo.modules.devmenu

import android.os.Bundle
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate

object DevMenuDevSettings {
  fun getDevSettings(reactHost: ReactHostWrapper): Bundle {
    val devDelegate = DevMenuDevToolsDelegate(DevMenuManager, reactHost)
    val devSettings = devDelegate.devSettings

    if (devSettings != null) {
      return Bundle().apply {
        putBoolean("isElementInspectorShown", devSettings.isElementInspectorEnabled)
        putBoolean("isHotLoadingEnabled", devDelegate.devInternalSettings?.isHotModuleReplacementEnabled ?: false)
        putBoolean("isPerfMonitorShown", devSettings.isFpsDebugEnabled)
        putBoolean("isElementInspectorAvailable", devSettings.isJSDevModeEnabled)
        putBoolean("isHotLoadingAvailable", devSettings.isJSDevModeEnabled)
        putBoolean("isPerfMonitorAvailable", devSettings.isJSDevModeEnabled)
        putBoolean(
          "isJSInspectorAvailable",
          run {
            val jsExecutorName = reactHost.jsExecutorName
            jsExecutorName.contains("Hermes") || jsExecutorName.contains("V8")
          }
        )
      }
    }

    return Bundle().apply {
      putBoolean("isElementInspectorShown", false)
      putBoolean("isHotLoadingEnabled", false)
      putBoolean("isPerfMonitorShown", false)
      putBoolean("isElementInspectorAvailable", false)
      putBoolean("isHotLoadingAvailable", false)
      putBoolean("isPerfMonitorAvailable", false)
      putBoolean("isJSInspectorAvailable", false)
    }
  }
}
