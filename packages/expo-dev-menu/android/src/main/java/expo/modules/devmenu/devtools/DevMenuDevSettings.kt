package expo.modules.devmenu.devtools

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.DEV_MENU_TAG
import expo.modules.devmenu.DevMenuManager
import kotlinx.coroutines.launch

object DevMenuDevSettings {
  private fun getDevSupportManager(): DevSupportManager? {
    val reactInstanceManager = DevMenuManager.getInstanceManager()
    return reactInstanceManager?.devSupportManager
  }

  private fun getCurrentDevSettings(): DevInternalSettings? {
    return getDevSupportManager()?.devSettings as DevInternalSettings
  }

  private fun getCurrentReactContext(): ReactContext? {
    return DevMenuManager.getInstanceManager()?.currentReactContext
  }

  fun getSettings(): Map<String, Boolean> {
    val devSettings = getCurrentDevSettings()

    return mutableMapOf<String, Boolean>().apply {
      put("isDebuggingRemotely", devSettings?.isRemoteJSDebugEnabled ?: false)
      put("isElementInspectorShown", devSettings?.isElementInspectorEnabled ?: false)
      put("isHotLoadingEnabled", devSettings?.isHotModuleReplacementEnabled ?: false)
      put("isPerfMonitorShown", devSettings?.isFpsDebugEnabled ?: false)
    }
  }

  fun reload() {
    val devSupportManager = getDevSupportManager() ?: return
    DevMenuManager.closeMenu()
    UiThreadUtil.runOnUiThread {
      devSupportManager.handleReloadJS()
    }
  }

  fun toggleElementInspector() = runWithDevSupportEnabled {
    getDevSupportManager()?.toggleElementInspector()
  }

  fun toggleRemoteDebugging() = runWithDevSupportEnabled {
    val reactDevManager = getDevSupportManager() ?: return
    val devSettings = getCurrentDevSettings() ?: return

    DevMenuManager.closeMenu()
    UiThreadUtil.runOnUiThread {
      devSettings.isRemoteJSDebugEnabled = !devSettings.isRemoteJSDebugEnabled
      reactDevManager.handleReloadJS()
    }
  }

  fun togglePerformanceMonitor() {
    val context = getCurrentReactContext() ?: return
    val reactDevManager = getDevSupportManager() ?: return
    val devSettings = getCurrentDevSettings() ?: return

    requestOverlaysPermission(context)
    runWithDevSupportEnabled {
      reactDevManager.setFpsDebugEnabled(!devSettings.isFpsDebugEnabled)
    }
  }

  fun openJsInspector() = runWithDevSupportEnabled {
    val devSettings = getCurrentDevSettings() ?: return
    val reactContext = getCurrentReactContext() ?: return
    val metroHost = "http://${devSettings.packagerConnectionSettings.debugServerHost}"

    DevMenuManager.coroutineScope.launch {
      try {
        DevMenuManager.metroClient.openJSInspector(metroHost, reactContext.packageName)
      } catch (e: Exception) {
        Log.w(DEV_MENU_TAG, "Unable to open js inspector: ${e.message}", e)
      }
    }
  }

  fun toggleFastRefresh() = runWithDevSupportEnabled {
    val devSettings = getCurrentDevSettings() ?: return
    devSettings.isHotModuleReplacementEnabled = !devSettings.isHotModuleReplacementEnabled
  }
  /**
   * RN will temporary disable `devSupport` if the current activity isn't active.
   * Because of that we can't call some functions like `toggleElementInspector`.
   * However, we can temporary set the `devSupport` flag to true and run needed methods.
   */
  private inline fun runWithDevSupportEnabled(action: () -> Unit) {
    val reactDevManager = getDevSupportManager() ?: return
    val currentSetting = reactDevManager.devSupportEnabled
    reactDevManager.devSupportEnabled = true
    action()
    reactDevManager.devSupportEnabled = currentSetting
  }

  /**
   * Requests for the permission that allows the app to draw overlays on other apps.
   * Such permission is required to enable performance monitor.
   */
  private fun requestOverlaysPermission(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
      !Settings.canDrawOverlays(context)) {
      val uri = Uri.parse("package:" + context.applicationContext.packageName)
      val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, uri).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
      }
    }
  }
}
