package versioned.host.exp.exponent.core.modules

import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.updates.IUpdatesController
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
      appLoader?.let { appLoaderLocal ->
        IUpdatesController.UpdatesModuleConstants(
          emergencyLaunchException = null,
          embeddedUpdate = null,
          isEnabled = true,
          isUsingEmbeddedAssets = false,
          runtimeVersion = appLoaderLocal.updatesConfiguration.runtimeVersionRaw ?: "",
          checkOnLaunch = appLoaderLocal.updatesConfiguration.checkOnLaunch,
          requestHeaders = appLoaderLocal.updatesConfiguration.requestHeaders,
          shouldDeferToNativeForAPIMethodAvailabilityInDevelopment = true,
          launchedUpdate = appLoaderLocal.launcher.launchedUpdate,
          localAssetFiles = appLoaderLocal.launcher.localAssetFiles,
          launchDuration = appLoaderLocal.launchDuration,
          initialContext = UpdatesStateContext()
        ).toModuleConstantsMap()
      } ?: mapOf()
    }

    AsyncFunction("reload") { promise: Promise ->
      KernelProvider.instance.reloadVisibleExperience(manifestUrl!!, true)
      promise.resolve(null)
    }

    AsyncFunction("checkForUpdateAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "checkForUpdateAsync() is not supported in Expo Go. A non-development build should be used to test this functionality.",
        null
      )
    }

    AsyncFunction("fetchUpdateAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "fetchUpdateAsync() is not supported in Expo Go. A non-development build should be used to test this functionality.",
        null
      )
    }

    AsyncFunction("getExtraParamsAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "getExtraParamsAsync() is not supported in Expo Go. A non-development build should be used to test this functionality.",
        null
      )
    }

    AsyncFunction("setExtraParamAsync") { promise: Promise ->
      promise.reject(
        "ERR_NOT_SUPPORTED",
        "setExtraParamAsync() is not supported in Expo Go. A non-development build should be used to test this functionality.",
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
