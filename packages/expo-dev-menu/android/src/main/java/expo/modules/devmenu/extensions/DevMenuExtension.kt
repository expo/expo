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
import expo.interfaces.devmenu.items.DevMenuAction
import expo.interfaces.devmenu.items.DevMenuItem
import expo.interfaces.devmenu.items.DevMenuItemImportance
import expo.interfaces.devmenu.items.KeyCommand
import expo.interfaces.devmenu.DevMenuExtensionInterface

class DevMenuExtension(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext), DevMenuExtensionInterface {
  override fun getName() = "ExpoDevMenuExtensions"

  private val devSupportManager: DevSupportManager?
    get() {
      val reactApplication = currentActivity?.application as ReactApplication?
      return reactApplication?.reactNativeHost?.reactInstanceManager?.devSupportManager
    }

  override fun devMenuItems(): List<DevMenuItem>? {
    val reactDevManager = devSupportManager
    val devSettings = reactDevManager?.devSettings

    if (reactDevManager == null || devSettings == null) {
      return emptyList()
    }

    // RN will temporary disable `devSupport` if the current activity isn't active.
    // Because of that we can't call some functions like `toggleElementInspector`.
    // However, we can temporary set the `devSupport` flag to true and run needed methods.
    val runWithDevSupportEnabled = { action: () -> Unit ->
      val currentSetting = reactDevManager.devSupportEnabled
      reactDevManager.devSupportEnabled = true
      action()
      reactDevManager.devSupportEnabled = currentSetting
    }

    val reloadAction = DevMenuAction("reload") {
      UiThreadUtil.runOnUiThread {
        reactDevManager.handleReloadJS()
      }
    }.apply {
      label = { "Reload" }
      glyphName = { "reload" }
      keyCommand = KeyCommand(KeyEvent.KEYCODE_R)
      importance = DevMenuItemImportance.HIGHEST.value
    }

    val elementInspectorAction = DevMenuAction("inspector") {
      runWithDevSupportEnabled {
        reactDevManager.toggleElementInspector()
      }
    }.apply {
      isEnabled = { devSettings.isElementInspectorEnabled }
      label = { if (isEnabled()) "Hide Element Inspector" else "Show Element Inspector" }
      glyphName = { "border-style" }
      keyCommand = KeyCommand(KeyEvent.KEYCODE_I)
      importance = DevMenuItemImportance.HIGH.value
    }

    val performanceMonitorAction = DevMenuAction("performance-monitor") {
      requestOverlaysPermission()
      runWithDevSupportEnabled {
        reactDevManager.setFpsDebugEnabled(!devSettings.isFpsDebugEnabled)
      }
    }.apply {
      isEnabled = { devSettings.isFpsDebugEnabled }
      label = { if (isEnabled()) "Hide Performance Monitor" else "Show Performance Monitor" }
      glyphName = { "speedometer" }
      keyCommand = KeyCommand(KeyEvent.KEYCODE_P)
      importance = DevMenuItemImportance.HIGH.value
    }

    val remoteDebugAction = DevMenuAction("remote-debug") {
      UiThreadUtil.runOnUiThread {
        devSettings.isRemoteJSDebugEnabled = !devSettings.isRemoteJSDebugEnabled
        reactDevManager.handleReloadJS()
      }
    }.apply {
      isEnabled = {
        devSettings.isRemoteJSDebugEnabled
      }
      label = { if (isEnabled()) "Stop Remote Debugging" else "Debug Remote JS" }
      glyphName = { "remote-desktop" }
      importance = DevMenuItemImportance.LOW.value
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
        importance = DevMenuItemImportance.LOW.value
      }

      result.add(fastRefreshAction)
    }

    return result
  }

  /**
   * Requests for the permission that allows the app to draw overlays on other apps.
   * Such permission is required to enable performance monitor.
   */
  private fun requestOverlaysPermission() {
    val context = currentActivity ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
      && !Settings.canDrawOverlays(context)) {
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
