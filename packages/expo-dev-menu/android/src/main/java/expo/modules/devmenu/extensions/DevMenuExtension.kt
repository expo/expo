package expo.modules.devmenu.extensions

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.view.KeyEvent
import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.extensions.items.DevMenuAction
import expo.modules.devmenu.extensions.items.DevMenuItem
import expo.modules.devmenu.extensions.items.ItemImportance
import expo.modules.devmenu.extensions.items.KeyCommand
import expo.modules.devmenu.managers.DevMenuManager
import expo.modules.devmenu.protocoles.DevMenuExtensionProtocol

class DevMenuExtension(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext), DevMenuExtensionProtocol {
  override fun getName() = "ExpoDevMenuExtensions"

  override fun devMenuItems(): List<DevMenuItem>? {
    val reactDevManager = getDevSupportManager()
    val devSettings = reactDevManager?.devSettings

    if (reactDevManager == null || devSettings == null) {
      return emptyList()
    }

    val reloadAction = DevMenuAction("reload") {
      UiThreadUtil.runOnUiThread {
        reactDevManager.handleReloadJS()
      }
    }.apply {
      label = { "Reload" }
      glyphName = { "reload" }
      keyCommand = KeyCommand(KeyEvent.KEYCODE_R, 0)
      importance = ItemImportance.HIGHEST.value
    }

    val elementInspectorAction = DevMenuAction("inspector") {
      runWithDevSettingEnabled {
        reactDevManager.toggleElementInspector()
      }
    }.apply {
      isEnabled = { devSettings.isElementInspectorEnabled }
      label = { if (isEnabled()) "Hide Element Inspector" else "Show Element Inspector" }
      glyphName = { "border-style" }
      keyCommand = KeyCommand(KeyEvent.KEYCODE_I, 0)
      importance = ItemImportance.HIGH.value
    }

    val performanceMonitorAction = DevMenuAction("performance-monitor") {
      requestOverlaysPermission()
      runWithDevSettingEnabled {
        reactDevManager.setFpsDebugEnabled(!devSettings.isFpsDebugEnabled)
      }
    }.apply {
      isEnabled = { devSettings.isFpsDebugEnabled }
      label = { if (isEnabled()) "Hide Performance Monitor" else "Show Performance Monitor" }
      glyphName = { "speedometer" }
      keyCommand = KeyCommand(KeyEvent.KEYCODE_P, 0)
      importance = ItemImportance.HIGH.value
    }

    val remoteDebugAction = DevMenuAction("remote-debug") {
      UiThreadUtil.runOnUiThread {
        val isRemoteJsEnable = devSettings.isRemoteJSDebugEnabled
        devSettings.isRemoteJSDebugEnabled = !isRemoteJsEnable
        reactDevManager.handleReloadJS()
      }
    }.apply {
      isEnabled = {
        devSettings.isRemoteJSDebugEnabled
      }
      label = { if (isEnabled()) "Stop Remote Debugging" else "Debug Remote JS" }
      glyphName = { "remote-desktop" }
      importance = ItemImportance.LOW.value
    }


    val result = mutableListOf(
      reloadAction,
      elementInspectorAction,
      remoteDebugAction,
      performanceMonitorAction
    )

    if (devSettings is DevInternalSettings) {
      val fastRefreshAction = DevMenuAction("fast-refresh") {
        devSettings.isHotModuleReplacementEnabled = !devSettings.isHotModuleReplacementEnabled

      }.apply {
        isEnabled = { devSettings.isHotModuleReplacementEnabled }
        label = { if (isEnabled()) "Disable Fast Refresh" else "Enable Fast Refresh" }
        glyphName = { "run-fast" }
        importance = ItemImportance.LOW.value
      }

      result.add(fastRefreshAction)
    }

    return result
  }

  /**
   * Requests for the permission that allows the app to draw overlays on other apps.
   * Such permission is required for example to enable performance monitor.
   */
  private fun requestOverlaysPermission() {
    val context = currentActivity ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Get permission to show debug overlay in dev builds.
      if (!Settings.canDrawOverlays(context)) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + context.packageName))
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        if (intent.resolveActivity(context.packageManager) != null) {
          context.startActivity(intent)
        }
      }
    }
  }

  private fun runWithDevSettingEnabled(action: () -> Unit) = synchronized(DevMenuManager) {
    val currentSetting = getDevSupportManager()?.devSupportEnabled ?: false
    getDevSupportManager()?.devSupportEnabled = true
    action()
    getDevSupportManager()?.devSupportEnabled = currentSetting
  }

  private fun getDevSupportManager(): DevSupportManager? {
    val reactApplication = currentActivity?.application as ReactApplication?
    return reactApplication?.reactNativeHost?.reactInstanceManager?.devSupportManager
  }
}
