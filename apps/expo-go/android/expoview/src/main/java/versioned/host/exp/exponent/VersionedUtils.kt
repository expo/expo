// Copyright 2015-present 650 Industries. All rights reserved.
package versioned.host.exp.exponent

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.packagerconnection.NotificationOnlyHandler
import com.facebook.react.packagerconnection.RequestHandler
import expo.modules.devmenu.api.CustomPerformanceMonitor
import expo.modules.jsonutils.getNullable
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.expoview.Exponent
import org.json.JSONObject

object VersionedUtils {
  private fun toggleExpoDevMenu() {
    val currentActivity = Exponent.instance.currentActivity
    if (currentActivity is ExperienceActivity) {
      currentActivity.toggleDevMenu()
    } else {
      FLog.e(
        ReactConstants.TAG,
        "Unable to toggle the Expo dev menu because the current activity could not be found."
      )
    }
  }

  // The packager sends its reload command on a WebSocket thread and handleReloadJS has to run on the
  // UI thread. Hopping threads here also serialises repeated reloads, such as holding "r" in the CLI.
  fun reloadExpoApp() {
    UiThreadUtil.runOnUiThread {
      val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity
        ?: return@runOnUiThread FLog.e(
          ReactConstants.TAG,
          "Unable to reload the app because the current activity could not be found."
        )
      val devSupportManager = currentActivity.devSupportManager
        ?: return@runOnUiThread FLog.e(
          ReactConstants.TAG,
          "Unable to get the DevSupportManager from current activity."
        )

      devSupportManager.handleReloadJS()
    }
  }

  private fun toggleElementInspector() {
    val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to toggle the element inspector because the current activity could not be found."
      )
    }
    val devSupportManager = currentActivity.devSupportManager ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to get the DevSupportManager from current activity."
      )
    }

    devSupportManager.toggleElementInspector()
  }

  private fun togglePerformanceMonitor() {
    val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to toggle the performance monitor because the current activity could not be found."
      )
    }
    val devSupportManager = currentActivity.devSupportManager ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to get the DevSupportManager from current activity."
      )
    }

    val isShown = (devSupportManager as? CustomPerformanceMonitor)?.isPerformanceMonitorShown
      ?: devSupportManager.devSettings?.isFpsDebugEnabled
      ?: false
    devSupportManager.setFpsDebugEnabled(!isShown)
  }

  fun createPackagerCommandHelpers(): Map<String, RequestHandler> {
    // Attach listeners to the bundler's dev server web socket connection.
    // This enables tools to automatically reload the client remotely (i.e. in expo-cli).
    val packagerCommandHandlers = mutableMapOf<String, RequestHandler>()

    // Enable a lot of tools under the same command namespace
    packagerCommandHandlers["sendDevCommand"] = object : NotificationOnlyHandler() {
      override fun onNotification(params: Any?) {
        if (params != null && params is JSONObject) {
          when (params.getNullable<String>("name")) {
            "reload" -> reloadExpoApp()
            "toggleDevMenu" -> toggleExpoDevMenu()
            "toggleElementInspector" -> toggleElementInspector()
            "togglePerformanceMonitor" -> togglePerformanceMonitor()
          }
        }
      }
    }

    // These commands (reload and devMenu) are here to match RN dev tooling.

    // Reload the app on "reload"
    packagerCommandHandlers["reload"] = object : NotificationOnlyHandler() {
      override fun onNotification(params: Any?) {
        reloadExpoApp()
      }
    }

    // Open the dev menu on "devMenu"
    packagerCommandHandlers["devMenu"] = object : NotificationOnlyHandler() {
      override fun onNotification(params: Any?) {
        toggleExpoDevMenu()
      }
    }

    return packagerCommandHandlers
  }
}
