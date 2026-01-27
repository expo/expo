package expo.modules.devmenu.devtools

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import androidx.core.net.toUri
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.HMRClient
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.DevMenuSettings
import expo.modules.devmenu.api.DevMenuApi
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.websockets.DevMenuMetroClient
import kotlinx.coroutines.DelicateCoroutinesApi
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.GlobalScope
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class DevMenuDevToolsDelegate(
  private val weakDevSupportManager: WeakReference<out DevSupportManager>
) {
  private val devSupportManager: DevSupportManager?
    get() = weakDevSupportManager.get()

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
    devSupportManager.setFpsDebugEnabled(!devSettings.isFpsDebugEnabled)
  }

  fun toggleFastRefresh() {
    val internalSettings = devSettings ?: return

    val nextEnabled = !internalSettings.isHotModuleReplacementEnabled
    internalSettings.isHotModuleReplacementEnabled = nextEnabled

    if (nextEnabled) {
      reactContext?.getJSModule(HMRClient::class.java)?.enable()
    } else {
      reactContext?.getJSModule(HMRClient::class.java)?.disable()
    }

    if (nextEnabled && !internalSettings.isJSDevModeEnabled) {
      internalSettings.isJSDevModeEnabled = true
      reload()
    }
  }

  @OptIn(DelicateCoroutinesApi::class)
  fun openJSInspector() {
    val devSettings = devSettings ?: return
    val context = context ?: return

    val metroHost = "http://${devSettings.packagerConnectionSettings.debugServerHost}"

    // We can use GlobalScope here because this operation is not tied to any specific lifecycle.
    // We just want to fire and forget.
    GlobalScope.launch(Dispatchers.Default) {
      try {
        DevMenuMetroClient.openJSInspector(metroHost, context.packageName)
      } catch (e: Exception) {
        Log.w("DevMenu", "Unable to open js inspector: ${e.message}", e)
      }
    }
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
