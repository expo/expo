package expo.modules.devmenu.devtools

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.provider.Settings
import android.util.Log
import androidx.core.net.toUri
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.interfaces.DevSupportManager
import expo.modules.devmenu.DEV_MENU_TAG
import expo.modules.devmenu.DevMenuManager
import expo.modules.devmenu.compose.BindingView
import expo.modules.devmenu.compose.DevMenuAction
import expo.modules.devmenu.compose.DevMenuViewModel
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

  private fun findDevMenuModel(): DevMenuViewModel? {
    return currentActivity?.let { BindingView.findIn(activity = it)?.viewModel }
  }

  val devSettings
    get() = devSupportManager?.devSettings

  fun toggleMenu() {
    findDevMenuModel()
      ?.onAction(DevMenuAction.Toggle)
  }

  fun reload() {
    findDevMenuModel()
      ?.onAction(DevMenuAction.Close)

    UiThreadUtil.runOnUiThread {
      devSupportManager?.handleReloadJS()
    }
  }

  fun toggleElementInspector() {
    devSupportManager?.toggleElementInspector()
  }

  fun togglePerformanceMonitor() {
    val devSupportManager = devSupportManager ?: return
    val devSettings = devSettings ?: return
    val context = context ?: return

    requestOverlaysPermission(context)
    devSupportManager.setFpsDebugEnabled(!devSettings.isFpsDebugEnabled)
  }

  fun openJSInspector() {
    val devSettings = devSettings ?: return
    val context = context ?: return

    val metroHost = "http://${devSettings.packagerConnectionSettings.debugServerHost}"

    DevMenuManager.coroutineScope.launch {
      try {
        DevMenuManager.metroClient.openJSInspector(metroHost, context.packageName)
      } catch (e: Exception) {
        Log.w(DEV_MENU_TAG, "Unable to open js inspector: ${e.message}", e)
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
