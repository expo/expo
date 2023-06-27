// Copyright 2015-present 650 Industries. All rights reserved.
package abi49_0_0.host.exp.exponent

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.common.logging.FLog
import abi49_0_0.com.facebook.hermes.reactexecutor.HermesExecutorFactory
import abi49_0_0.com.facebook.react.ReactInstanceManager
import abi49_0_0.com.facebook.react.ReactInstanceManagerBuilder
import abi49_0_0.com.facebook.react.bridge.JavaScriptContextHolder
import abi49_0_0.com.facebook.react.bridge.JavaScriptExecutorFactory
import abi49_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi49_0_0.com.facebook.react.common.LifecycleState
import abi49_0_0.com.facebook.react.common.ReactConstants
import abi49_0_0.com.facebook.react.jscexecutor.JSCExecutorFactory
import abi49_0_0.com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import abi49_0_0.com.facebook.react.packagerconnection.NotificationOnlyHandler
import abi49_0_0.com.facebook.react.packagerconnection.RequestHandler
import abi49_0_0.com.facebook.react.shell.MainReactPackage
import expo.modules.jsonutils.getNullable
import host.exp.exponent.RNObject
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.expoview.Exponent
import host.exp.expoview.Exponent.InstanceManagerBuilderProperties
import org.json.JSONObject
import java.util.*

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

  private fun reloadExpoApp() {
    val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to reload the app because the current activity could not be found."
      )
    }
    val devSupportManager = currentActivity.devSupportManager ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to get the DevSupportManager from current activity."
      )
    }

    devSupportManager.callRecursive("reloadExpoApp")
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

    devSupportManager.callRecursive("toggleElementInspector")
  }

  private fun requestOverlayPermission(context: Context) {
    // From the unexposed DebugOverlayController static helper
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      // Get permission to show debug overlay in dev builds.
      if (!Settings.canDrawOverlays(context)) {
        val intent = Intent(
          Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
          Uri.parse("package:" + context.packageName)
        ).apply {
          flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        FLog.w(
          ReactConstants.TAG,
          "Overlay permissions needs to be granted in order for React Native apps to run in development mode"
        )
        if (intent.resolveActivity(context.packageManager) != null) {
          context.startActivity(intent)
        }
      }
    }
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

    val devSettings = devSupportManager.callRecursive("getDevSettings")
    if (devSettings != null) {
      val isFpsDebugEnabled = devSettings.call("isFpsDebugEnabled") as Boolean
      if (!isFpsDebugEnabled) {
        // Request overlay permission if needed when "Show Perf Monitor" option is selected
        requestOverlayPermission(currentActivity)
      }
      devSettings.call("setFpsDebugEnabled", !isFpsDebugEnabled)
    }
  }

  private fun toggleRemoteJSDebugging() {
    val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to toggle remote JS debugging because the current activity could not be found."
      )
    }
    val devSupportManager = currentActivity.devSupportManager ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to get the DevSupportManager from current activity."
      )
    }

    val devSettings = devSupportManager.callRecursive("getDevSettings")
    if (devSettings != null) {
      val isRemoteJSDebugEnabled = devSettings.call("isRemoteJSDebugEnabled") as Boolean
      devSettings.call("setRemoteJSDebugEnabled", !isRemoteJSDebugEnabled)
    }
  }

  private fun reconnectReactDevTools() {
    val currentActivity = Exponent.instance.currentActivity as? ReactNativeActivity ?: return run {
      FLog.e(
        ReactConstants.TAG,
        "Unable to get the current activity."
      )
    }
    // Emit the `RCTDevMenuShown` for the app to reconnect react-devtools
    // https://github.com/facebook/react-native/blob/22ba1e45c52edcc345552339c238c1f5ef6dfc65/Libraries/Core/setUpReactDevTools.js#L80
    currentActivity.emitRCTNativeAppEvent("RCTDevMenuShown", null)
  }

  private fun createPackagerCommandHelpers(): Map<String, RequestHandler> {
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
            "toggleRemoteDebugging" -> {
              toggleRemoteJSDebugging()
              // Reload the app after toggling debugging, this is based on what we do in DevSupportManagerBase.
              reloadExpoApp()
            }
            "toggleElementInspector" -> toggleElementInspector()
            "togglePerformanceMonitor" -> togglePerformanceMonitor()
            "reconnectReactDevTools" -> reconnectReactDevTools()
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

  @JvmStatic fun getReactInstanceManagerBuilder(instanceManagerBuilderProperties: InstanceManagerBuilderProperties): ReactInstanceManagerBuilder {
    // Build the instance manager
    var builder = ReactInstanceManager.builder()
      .setApplication(instanceManagerBuilderProperties.application)
      .setJSIModulesPackage { reactApplicationContext: ReactApplicationContext, jsContext: JavaScriptContextHolder? ->
        emptyList()
      }
      .addPackage(MainReactPackage())
      .addPackage(
        ExponentPackage(
          instanceManagerBuilderProperties.experienceProperties,
          instanceManagerBuilderProperties.manifest,
          null, null,
          instanceManagerBuilderProperties.singletonModules
        )
      )
      .addPackage(
        ExpoTurboPackage(
          instanceManagerBuilderProperties.experienceProperties,
          instanceManagerBuilderProperties.manifest
        )
      )
      .setMinNumShakes(100) // disable the RN dev menu
      .setInitialLifecycleState(LifecycleState.BEFORE_CREATE)
      .setCustomPackagerCommandHandlers(createPackagerCommandHelpers())
      .setJavaScriptExecutorFactory(createJSExecutorFactory(instanceManagerBuilderProperties))
    if (instanceManagerBuilderProperties.jsBundlePath != null && instanceManagerBuilderProperties.jsBundlePath!!.isNotEmpty()) {
      builder = builder.setJSBundleFile(instanceManagerBuilderProperties.jsBundlePath)
    }
    return builder
  }

  private fun getDevSupportManager(reactApplicationContext: ReactApplicationContext): RNObject? {
    val currentActivity = Exponent.instance.currentActivity
    return if (currentActivity != null) {
      if (currentActivity is ReactNativeActivity) {
        currentActivity.devSupportManager
      } else {
        null
      }
    } else try {
      val devSettingsModule = reactApplicationContext.catalystInstance.getNativeModule("DevSettings")
      val devSupportManagerField = devSettingsModule!!.javaClass.getDeclaredField("mDevSupportManager")
      devSupportManagerField.isAccessible = true
      RNObject.wrap(devSupportManagerField[devSettingsModule]!!)
    } catch (e: Throwable) {
      e.printStackTrace()
      null
    }
  }

  private fun createJSExecutorFactory(
    instanceManagerBuilderProperties: InstanceManagerBuilderProperties
  ): JavaScriptExecutorFactory? {
    val appName = instanceManagerBuilderProperties.manifest.getName() ?: ""
    val deviceName = AndroidInfoHelpers.getFriendlyDeviceName()

    val jsEngineFromManifest = instanceManagerBuilderProperties.manifest.jsEngine
    return if (jsEngineFromManifest == "hermes") HermesExecutorFactory() else JSCExecutorFactory(
      appName,
      deviceName
    )
  }
}
