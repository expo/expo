package abi49_0_0.host.exp.exponent.core.modules

import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import abi49_0_0.expo.modules.kotlin.Promise
import abi49_0_0.expo.modules.kotlin.exception.Exceptions
import abi49_0_0.expo.modules.kotlin.modules.Module
import abi49_0_0.expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.updates.BuildConfig
import expo.modules.updates.logging.UpdatesLogEntry
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.statemachine.UpdatesStateContext
import host.exp.exponent.kernel.KernelConstants
import host.exp.exponent.kernel.KernelProvider
import java.util.Date

class ExpoGoUpdatesModule(experienceProperties: Map<String, Any?>) : Module() {
  private val manifestUrl = experienceProperties[KernelConstants.MANIFEST_URL_KEY] as String?
  private val appLoader
    get() = KernelProvider.instance.getAppLoaderForManifestUrl(manifestUrl)

  val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoUpdates")

    Constants {
      val appLoaderLocal = appLoader
      if (appLoaderLocal == null) {
        mapOf()
      } else {
        val constants = mutableMapOf<String, Any>()
        val configuration = appLoaderLocal.updatesConfiguration

        constants["isEmergencyLaunch"] = appLoaderLocal.isEmergencyLaunch
        constants["isEmbeddedLaunch"] = false
        constants["isMissingRuntimeVersion"] = configuration.isMissingRuntimeVersion
        constants["isEnabled"] = configuration.isEnabled
        constants["releaseChannel"] = configuration.releaseChannel
        constants["isUsingEmbeddedAssets"] = false
        constants["runtimeVersion"] = configuration.runtimeVersion ?: ""
        constants["checkAutomatically"] = configuration.checkOnLaunch.toJSString()
        constants["channel"] = configuration.requestHeaders["expo-channel-name"] ?: ""
        constants["nativeDebug"] = BuildConfig.EX_UPDATES_NATIVE_DEBUG

        val launchedUpdate = appLoaderLocal.launcher.launchedUpdate
        if (launchedUpdate != null) {
          constants["updateId"] = launchedUpdate.id.toString()
          constants["commitTime"] = launchedUpdate.commitTime.time
          constants["manifestString"] = launchedUpdate.manifest.toString()
        }
        val localAssetFiles = appLoaderLocal.launcher.localAssetFiles
        if (localAssetFiles != null) {
          val localAssets = mutableMapOf<String, String>()
          for (asset in localAssetFiles.keys) {
            if (asset.key != null) {
              localAssets[asset.key!!] = localAssetFiles[asset]!!
            }
          }
          constants["localAssets"] = localAssets
        }
        constants
      }
    }

    AsyncFunction("reload") { promise: Promise ->
      KernelProvider.instance.reloadVisibleExperience(manifestUrl!!, true)
      promise.resolve(null)
    }

    // Used internally by useUpdates() to get its initial state
    AsyncFunction("getNativeStateMachineContextAsync") { promise: Promise ->
      val context = UpdatesStateContext()
      promise.resolve(context.bundle)
    }

    AsyncFunction("checkForUpdateAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "checkForUpdateAsync() is not accessible in Expo Go. Please use a Development Client build to test.",
        null
      )
    }

    AsyncFunction("fetchUpdateAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "fetchUpdateAsync() is not accessible in Expo Go. Please use a Development Client build to test.",
        null
      )
    }

    AsyncFunction("getExtraParamsAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "getExtraParamsAsync() is not accessible in Expo Go. Please use a Development Client build to test.",
        null
      )
    }

    AsyncFunction("setExtraParamAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "setExtraParamAsync() is not accessible in Expo Go. Please use a Development Client build to test.",
        null
      )
    }

    AsyncFunction("readLogEntriesAsync") { maxAge: Int, promise: Promise ->
      AsyncTask.execute {
        val reader = UpdatesLogReader(context)
        val date = Date()
        val epoch = Date(date.time - maxAge)
        val results = reader.getLogEntries(epoch)
          .mapNotNull { UpdatesLogEntry.create(it) }
          .map { entry ->
            Bundle().apply {
              putLong("timestamp", entry.timestamp)
              putString("message", entry.message)
              putString("code", entry.code)
              putString("level", entry.level)
              if (entry.updateId != null) {
                putString("updateId", entry.updateId)
              }
              if (entry.assetId != null) {
                putString("assetId", entry.assetId)
              }
              if (entry.stacktrace != null) {
                putStringArray("stacktrace", entry.stacktrace!!.toTypedArray())
              }
            }
          }
        promise.resolve(results)
      }
    }

    AsyncFunction("clearLogEntriesAsync") { promise: Promise ->
      AsyncTask.execute {
        val reader = UpdatesLogReader(context)
        reader.purgeLogEntries(
          olderThan = Date()
        ) { error ->
          if (error != null) {
            promise.reject(
              "ERR_UPDATES_READ_LOGS",
              "There was an error when clearing the expo-updates log file",
              error
            )
          } else {
            promise.resolve(null)
          }
        }
      }
    }
  }
}
