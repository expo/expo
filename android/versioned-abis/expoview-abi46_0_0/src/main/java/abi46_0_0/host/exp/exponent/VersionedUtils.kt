// Copyright 2015-present 650 Industries. All rights reserved.
package abi46_0_0.host.exp.exponent

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import android.util.Log
import com.facebook.common.logging.FLog
import abi46_0_0.com.facebook.hermes.reactexecutor.HermesExecutorFactory
import abi46_0_0.com.facebook.react.ReactInstanceManager
import abi46_0_0.com.facebook.react.ReactInstanceManagerBuilder
import abi46_0_0.com.facebook.react.bridge.JavaScriptContextHolder
import abi46_0_0.com.facebook.react.bridge.JavaScriptExecutorFactory
import abi46_0_0.com.facebook.react.bridge.ReactApplicationContext
import abi46_0_0.com.facebook.react.common.LifecycleState
import abi46_0_0.com.facebook.react.common.ReactConstants
import abi46_0_0.com.facebook.react.jscexecutor.JSCExecutorFactory
import abi46_0_0.com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import abi46_0_0.com.facebook.react.packagerconnection.NotificationOnlyHandler
import abi46_0_0.com.facebook.react.packagerconnection.RequestHandler
import abi46_0_0.com.facebook.react.shell.MainReactPackage
import expo.modules.jsonutils.getNullable
import host.exp.exponent.Constants
import host.exp.exponent.RNObject
import host.exp.exponent.experience.ExperienceActivity
import host.exp.exponent.experience.ReactNativeActivity
import host.exp.exponent.kernel.KernelProvider
import host.exp.expoview.Exponent
import host.exp.expoview.Exponent.InstanceManagerBuilderProperties
import org.json.JSONObject
import abi46_0_0.host.exp.exponent.modules.api.reanimated.ReanimatedJSIModulePackage
import java.io.File
import java.io.FileInputStream
import java.io.FileNotFoundException
import java.io.IOException
import java.util.*

object VersionedUtils {
  // Update this value when hermes-engine getting updated.
  // Currently there is no way to retrieve Hermes bytecode version from Java,
  // as an alternative, we maintain the version by hand.
  private const val HERMES_BYTECODE_VERSION = 85

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
        val devSupportManager = getDevSupportManager(reactApplicationContext)
        if (devSupportManager == null) {
          Log.e(
            "Exponent",
            "Couldn't get the `DevSupportManager`. JSI modules won't be initialized."
          )
          return@setJSIModulesPackage emptyList()
        }
        val devSettings = devSupportManager.callRecursive("getDevSettings")
        val isRemoteJSDebugEnabled = devSettings != null && devSettings.call("isRemoteJSDebugEnabled") as Boolean
        if (!isRemoteJSDebugEnabled) {
          return@setJSIModulesPackage ReanimatedJSIModulePackage().getJSIModules(
            reactApplicationContext,
            jsContext
          )
        }
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

    if (Constants.isStandaloneApp()) {
      return JSCExecutorFactory(appName, deviceName)
    }

    val hermesBundlePair = parseHermesBundleHeader(instanceManagerBuilderProperties.jsBundlePath)
    if (hermesBundlePair.first && hermesBundlePair.second != HERMES_BYTECODE_VERSION) {
      val message = String.format(
        Locale.US,
        "Unable to load unsupported Hermes bundle.\n\tsupportedBytecodeVersion: %d\n\ttargetBytecodeVersion: %d",
        HERMES_BYTECODE_VERSION, hermesBundlePair.second
      )
      KernelProvider.instance.handleError(RuntimeException(message))
      return null
    }
    val jsEngineFromManifest = instanceManagerBuilderProperties.manifest.jsEngine
    return if (jsEngineFromManifest == "hermes") HermesExecutorFactory() else JSCExecutorFactory(
      appName,
      deviceName
    )
  }

  private fun parseHermesBundleHeader(jsBundlePath: String?): Pair<Boolean, Int> {
    if (jsBundlePath == null || jsBundlePath.isEmpty()) {
      return Pair(false, 0)
    }

    // https://github.com/facebook/hermes/blob/release-v0.5/include/hermes/BCGen/HBC/BytecodeFileFormat.h#L24-L25
    val HERMES_MAGIC_HEADER = byteArrayOf(
      0xc6.toByte(), 0x1f.toByte(), 0xbc.toByte(), 0x03.toByte(),
      0xc1.toByte(), 0x03.toByte(), 0x19.toByte(), 0x1f.toByte()
    )
    val file = File(jsBundlePath)
    try {
      FileInputStream(file).use { inputStream ->
        val bytes = ByteArray(12)
        inputStream.read(bytes, 0, bytes.size)

        // Magic header
        for (i in HERMES_MAGIC_HEADER.indices) {
          if (bytes[i] != HERMES_MAGIC_HEADER[i]) {
            return Pair(false, 0)
          }
        }

        // Bytecode version
        val bundleBytecodeVersion: Int =
          (bytes[11].toInt() shl 24) or (bytes[10].toInt() shl 16) or (bytes[9].toInt() shl 8) or bytes[8].toInt()
        return Pair(true, bundleBytecodeVersion)
      }
    } catch (e: FileNotFoundException) {
    } catch (e: IOException) {
    }

    return Pair(false, 0)
  }

  internal fun isHermesBundle(jsBundlePath: String?): Boolean {
    return parseHermesBundleHeader(jsBundlePath).first
  }

  internal fun getHermesBundleBytecodeVersion(jsBundlePath: String?): Int {
    return parseHermesBundleHeader(jsBundlePath).second
  }
}
