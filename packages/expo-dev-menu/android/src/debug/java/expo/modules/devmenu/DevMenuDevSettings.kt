package expo.modules.devmenu

import android.os.Bundle
import expo.interfaces.devmenu.ReactHostWrapper
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate

object DevMenuDevSettings {
  fun getDevSettings(reactHost: ReactHostWrapper): Bundle {
    val devDelegate = DevMenuDevToolsDelegate(DevMenuManager, reactHost)
    val devSettings = devDelegate.devSettings

    val jsBundleURL = try {
      // Attempt to get the field "jsBundleURLForRemoteDebugging"
      val field = reactHost.devSupportManager?.javaClass?.getDeclaredField("jsBundleURLForRemoteDebugging")
      field?.isAccessible = true
      field?.get(reactHost.devSupportManager) as? String
    } catch (e: NoSuchFieldException) {
      // If the field is not found, try "jSBundleURLForRemoteDebugging"
      try {
        val field = reactHost.devSupportManager?.javaClass?.getDeclaredField("jSBundleURLForRemoteDebugging")
        field?.isAccessible = true
        field?.get(reactHost.devSupportManager) as? String
      } catch (e: NoSuchFieldException) {
       null
      }
    } ?: ""

    if (devSettings != null) {
      return Bundle().apply {
        putBoolean("isDebuggingRemotely", devSettings.isRemoteJSDebugEnabled)
        putBoolean("isElementInspectorShown", devSettings.isElementInspectorEnabled)
        putBoolean("isHotLoadingEnabled", devDelegate.devInternalSettings?.isHotModuleReplacementEnabled ?: false)
        putBoolean("isPerfMonitorShown", devSettings.isFpsDebugEnabled)
        putBoolean("isRemoteDebuggingAvailable", jsBundleURL.isNotEmpty())
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
