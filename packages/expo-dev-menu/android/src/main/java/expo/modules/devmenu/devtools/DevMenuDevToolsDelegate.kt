package expo.modules.devmenu.devtools

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.react.ReactInstanceManager
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.devsupport.DevInternalSettings
import expo.interfaces.devmenu.DevMenuManagerInterface
import expo.modules.devmenu.DEV_MENU_TAG
import expo.modules.devmenu.DevMenuManager
import kotlinx.coroutines.launch
import java.lang.ref.WeakReference

class DevMenuDevToolsDelegate(
  private val manager: DevMenuManagerInterface,
  reactInstanceManager: ReactInstanceManager
) {
  private val _reactDevManager = WeakReference(
    reactInstanceManager.devSupportManager
  )
  private val _reactContext = WeakReference(
    reactInstanceManager.currentReactContext
  )

  val reactDevManager
    get() = _reactDevManager.get()

  val devSettings
    get() = reactDevManager?.devSettings

  val reactContext
    get() = _reactContext.get()

  fun reload() {
    val reactDevManager = reactDevManager ?: return
    manager.closeMenu()
    UiThreadUtil.runOnUiThread {
      reactDevManager.handleReloadJS()
    }
  }

  fun toggleElementInspector() = runWithDevSupportEnabled {
    reactDevManager?.toggleElementInspector()
  }

  fun toggleRemoteDebugging() = runWithDevSupportEnabled {
    val reactDevManager = reactDevManager ?: return
    val devSettings = devSettings ?: return
    manager.closeMenu()
    UiThreadUtil.runOnUiThread {
      devSettings.isRemoteJSDebugEnabled = !devSettings.isRemoteJSDebugEnabled
      reactDevManager.handleReloadJS()
    }
  }

  fun togglePerformanceMonitor(context: Context) {
    val reactDevManager = reactDevManager ?: return
    val devSettings = devSettings ?: return

    requestOverlaysPermission(context)
    runWithDevSupportEnabled {
      reactDevManager.setFpsDebugEnabled(!devSettings.isFpsDebugEnabled)
    }
  }

  fun openJSInspector() = runWithDevSupportEnabled {
    val devSettings = (devSettings as? DevInternalSettings) ?: return
    val reactContext = reactContext ?: return
    val metroHost = "http://${devSettings.packagerConnectionSettings.debugServerHost}"

    manager.coroutineScope.launch {
      try {
        DevMenuManager.metroClient.openJSInspector(metroHost, reactContext.packageName)
      } catch (e: Exception) {
        Log.w(DEV_MENU_TAG, "Unable to open js inspector: ${e.message}", e)
      }
    }
  }

  /**
   * RN will temporary disable `devSupport` if the current activity isn't active.
   * Because of that we can't call some functions like `toggleElementInspector`.
   * However, we can temporary set the `devSupport` flag to true and run needed methods.
   */
  private inline fun runWithDevSupportEnabled(action: () -> Unit) {
    val reactDevManager = reactDevManager ?: return
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
    if (
      Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
      !Settings.canDrawOverlays(context)
    ) {
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
