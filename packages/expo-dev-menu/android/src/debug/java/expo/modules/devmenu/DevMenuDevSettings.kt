package expo.modules.devmenu

import android.os.Bundle
import com.facebook.react.ReactInstanceManager
import com.facebook.react.devsupport.DevInternalSettings
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate
import kotlinx.coroutines.runBlocking

object DevMenuDevSettings {
  fun getDevSettings(reactInstanceManager: ReactInstanceManager): Bundle {
    val devDelegate = DevMenuDevToolsDelegate(DevMenuManager, reactInstanceManager)
    val devSettings = devDelegate.devSettings as? DevInternalSettings

    val jsBundleURL = reactInstanceManager.devSupportManager.jsBundleURLForRemoteDebugging

    if (devSettings != null) {
      return Bundle().apply {
        putBoolean("isDebuggingRemotely", devSettings.isRemoteJSDebugEnabled)
        putBoolean("isElementInspectorShown", devSettings.isElementInspectorEnabled)
        putBoolean("isHotLoadingEnabled", devSettings.isHotModuleReplacementEnabled)
        putBoolean("isPerfMonitorShown", devSettings.isFpsDebugEnabled)
        putBoolean("isRemoteDebuggingAvailable", jsBundleURL.isNotEmpty())
        putBoolean("isElementInspectorAvailable", devSettings.isJSDevModeEnabled)
        putBoolean("isHotLoadingAvailable", devSettings.isJSDevModeEnabled)
        putBoolean("isPerfMonitorAvailable", devSettings.isJSDevModeEnabled)
        putBoolean(
          "isJSInspectorAvailable",
          run {
            val jsExecutorName = reactInstanceManager.jsExecutorName
            jsExecutorName.contains("Hermes") || jsExecutorName.contains("V8")
          }
        )
      }
    }

    return Bundle().apply {
      putBoolean("isDebuggingRemotely", false)
      putBoolean("isElementInspectorShown", false)
      putBoolean("isHotLoadingEnabled", false)
      putBoolean("isPerfMonitorShown", false)
      putBoolean("isRemoteDebuggingAvailable", false)
      putBoolean("isElementInspectorAvailable", false)
      putBoolean("isHotLoadingAvailable", false)
      putBoolean("isPerfMonitorAvailable", false)
      putBoolean("isJSInspectorAvailable", false)
    }
  }
}
