package expo.modules.devmenu

import android.os.Bundle
import com.facebook.react.ReactInstanceManager
import com.facebook.react.devsupport.DevInternalSettings
import expo.modules.devmenu.devtools.DevMenuDevToolsDelegate

object DevMenuDevSettings {
  fun getDevSettings(reactInstanceManager: ReactInstanceManager): Bundle {
    val devDelegate = DevMenuDevToolsDelegate(DevMenuManager, reactInstanceManager)
    val devSettings = devDelegate.devSettings as? DevInternalSettings

    if (devSettings != null) {
      return Bundle().apply {
        putBoolean("isDebuggingRemotely", devSettings.isRemoteJSDebugEnabled)
        putBoolean("isElementInspectorShown", devSettings.isElementInspectorEnabled)
        putBoolean("isHotLoadingEnabled", devSettings.isHotModuleReplacementEnabled)
        putBoolean("isPerfMonitorShown", devSettings.isFpsDebugEnabled)
      }
    }

    return Bundle().apply {
      putBoolean("isDebuggingRemotely", false)
      putBoolean("isElementInspectorShown", false)
      putBoolean("isHotLoadingEnabled", false)
      putBoolean("isPerfMonitorShown", false)
    }
  }
}
