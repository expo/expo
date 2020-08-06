package expo.modules.devmenu.extensions

import com.facebook.react.ReactApplication
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.devsupport.DevInternalSettings
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.extensions.items.DevMenuAction
import expo.modules.devmenu.extensions.items.DevMenuItem
import expo.modules.devmenu.extensions.items.ItemImportance
import expo.modules.devmenu.managers.DevMenuManager


class DevMenuExtension(reactContext: ReactApplicationContext)
  : ReactContextBaseJavaModule(reactContext), DevMenuExtensionProtocol {
  override fun getName() = "ExpoDevMenuExtensions"

  override fun devMenuItems(): List<DevMenuItem>? {
    val reloadAction = DevMenuAction("reload") {
      // todo: run on ui thread
      DevMenuManager.runWithApplicationBundler {
        getDevSupportManager()?.handleReloadJS()
      }
    }.apply {
      label = { "Reload" }
      glyphName = { "reload" }
      importance = ItemImportance.HIGHEST.value
    }

    val elementInspectorAction = DevMenuAction("inspector") {
      runWithDevSettingEnabled {
        getDevSupportManager()?.toggleElementInspector()
      }
    }.apply {
      isEnabled = { !(getDevSupportManager()?.devSettings?.isElementInspectorEnabled ?: true) }
      label = { if (isEnabled()) "Hide Element Inspector" else "Show Element Inspector" }
      glyphName = { "border-style" }
      importance = ItemImportance.HIGH.value
    }

    val performanceMonitorAction = DevMenuAction("performance-monitor") {
      runWithDevSettingEnabled {
        val fpsDebug = getDevSupportManager()?.devSettings?.isFpsDebugEnabled ?: false
        getDevSupportManager()?.setFpsDebugEnabled(!fpsDebug)
      }
    }.apply {
      val fpsDebug = getDevSupportManager()?.devSettings?.isFpsDebugEnabled ?: false
      isEnabled = { fpsDebug }
      label = { if (isEnabled()) "Hide Performance Monitor" else "Show Performance Monitor" }
      glyphName = { "speedometer" }
      importance = ItemImportance.HIGH.value
    }

    val remoteDebugAction = DevMenuAction("remote-debug") {
      runWithDevSettingEnabled {
        DevMenuManager.runWithApplicationBundler {
          val isRemoteJsEnable = getDevSupportManager()?.devSettings?.isRemoteJSDebugEnabled
          if (isRemoteJsEnable != null) {
            getDevSupportManager()?.setRemoteJSDebugEnabled(!isRemoteJsEnable)
          }
        }
      }
    }.apply {
      isEnabled = { getDevSupportManager()?.devSettings?.isRemoteJSDebugEnabled ?: false }
      label = { if (isEnabled()) "Stop Remote Debugging" else "Debug Remote JS" }
      glyphName = { "remote-desktop" }
      importance = ItemImportance.LOW.value
    }

    val fastRefreshAction = DevMenuAction("fast-refresh") {
      val devSettings = getDevSupportManager()?.devSettings as? DevInternalSettings
      if (devSettings != null) {
        DevMenuManager.runWithApplicationBundler {
          devSettings.isHotModuleReplacementEnabled = !devSettings.isHotModuleReplacementEnabled
        }
      }
    }.apply {
      val isHotModuleEnable = (getDevSupportManager()?.devSettings as? DevInternalSettings)?.isHotModuleReplacementEnabled
        ?: false

      isEnabled = { isHotModuleEnable }
      label = { if (isEnabled()) "Disable Fast Refresh" else "Enable Fast Refresh" }
      glyphName = { "run-fast" }
      importance = ItemImportance.LOW.value
    }

    return listOf(reloadAction, elementInspectorAction, remoteDebugAction, fastRefreshAction, performanceMonitorAction)
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
