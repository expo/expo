package expo.modules.devmenu.devtools

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.provider.Settings
import androidx.core.net.toUri
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.DevMenuSettings
import expo.modules.devmenu.api.CustomPerformanceMonitor
import expo.modules.devmenu.api.DevMenuApi
import expo.modules.devmenu.compose.DevMenuAction
import java.lang.ref.WeakReference

class DevMenuDevToolsDelegate(
  private val devSupportManagerProvider: () -> DevSupportManager?
) {
  constructor(weakDevSupportManager: WeakReference<out DevSupportManager>) :
    this({ weakDevSupportManager.get() })

  private val devSupportManager: DevSupportManager?
    get() = devSupportManagerProvider()

  private val currentActivity: Activity?
    get() = devSupportManager?.currentActivity

  private val context: Context?
    get() = devSupportManager?.currentReactContext ?: currentActivity

  private val reactContext: ReactContext?
    get() = devSupportManager?.currentReactContext

  private val viewModel by DevMenuApi.model { currentActivity }

  val devSettings
    get() = devSupportManager?.devSettings

  fun toggleMenu() {
    viewModel
      ?.onAction(DevMenuAction.Toggle)
  }

  fun reload() {
    viewModel
      ?.onAction(DevMenuAction.Close)

    UiThreadUtil.runOnUiThread {
      val reloadAction = viewModel?.reloadAction ?: { devSupportManager?.handleReloadJS() }
      reloadAction()
    }
  }

  fun toggleElementInspector() {
    devSupportManager?.toggleElementInspector()
  }

  fun togglePerformanceMonitor() {
    val devSupportManager = devSupportManager ?: return
    val devSettings = devSettings ?: return
    val context = context ?: return

    if (DevMenuSettings.performanceMonitorNeedsOverlayPermission) {
      requestOverlaysPermission(context)
    }
    val isShown = (devSupportManager as? CustomPerformanceMonitor)?.isPerformanceMonitorShown
      ?: devSettings.isFpsDebugEnabled
    devSupportManager.setFpsDebugEnabled(!isShown)
  }

  fun toggleFastRefresh() {
    val internalSettings = devSettings ?: return

    val nextEnabled = !internalSettings.isHotModuleReplacementEnabled
    internalSettings.isHotModuleReplacementEnabled = nextEnabled

    val hmrClient = reactContext?.getJSModule(HMRClient::class.java)
    if (nextEnabled) {
      hmrClient?.enable()
    } else {
      hmrClient?.disable()
    }

    if (nextEnabled && !internalSettings.isJSDevModeEnabled) {
      internalSettings.isJSDevModeEnabled = true
      reload()
    }
  }

  fun openJSInspector() {
    devSupportManager?.openDebugger()
  }

  /**
   * Requests for the permission that allows the app to draw overlays on other apps.
   * Such permission is required to enable performance monitor.
   */
  private fun requestOverlaysPermission(context: Context) {
    if (!Settings.canDrawOverlays(context)) {
      val uri = ("package:" + context.applicationContext.packageName).toUri()
      val intent = Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, uri).apply {
        flags = Intent.FLAG_ACTIVITY_NEW_TASK
      }
      if (intent.resolveActivity(context.packageManager) != null) {
        context.startActivity(intent)
      }
    }
  }
}
