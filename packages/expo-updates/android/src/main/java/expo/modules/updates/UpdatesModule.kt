package expo.modules.updates

import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogEntry
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateContext
import java.lang.ref.WeakReference
import java.util.Date

/**
 * Exported module which provides to the JS runtime information about the currently running update
 * and updates state, along with methods to check for and download new updates, reload with the
 * newest downloaded update applied, and read/clear native log entries.
 */
class UpdatesModule : Module() {
  private val logger: UpdatesLogger
    get() = UpdatesLogger(context)

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoUpdates")

    Events(
      UPDATES_STATE_CHANGE_EVENT_NAME
    )

    Constants {
      UpdatesLogger(context).info("UpdatesModule: getConstants called", UpdatesErrorCode.None)
      mutableMapOf<String, Any?>().apply {
        val constantsForModule = UpdatesController.instance.getConstantsForModule()
        val launchedUpdate = constantsForModule.launchedUpdate
        val embeddedUpdate = constantsForModule.embeddedUpdate
        val isEmbeddedLaunch = launchedUpdate?.id?.equals(embeddedUpdate?.id) ?: false

        // keep these keys in sync with ExpoGoUpdatesModule
        this["isEmergencyLaunch"] = constantsForModule.emergencyLaunchException != null
        this["emergencyLaunchReason"] = constantsForModule.emergencyLaunchException?.message
        this["isEmbeddedLaunch"] = isEmbeddedLaunch
        this["isEnabled"] = constantsForModule.isEnabled
        this["isUsingEmbeddedAssets"] = constantsForModule.isUsingEmbeddedAssets
        this["runtimeVersion"] = constantsForModule.runtimeVersion ?: ""
        this["checkAutomatically"] = constantsForModule.checkOnLaunch.toJSString()
        this["channel"] = constantsForModule.requestHeaders["expo-channel-name"] ?: ""
        this["shouldDeferToNativeForAPIMethodAvailabilityInDevelopment"] = constantsForModule.shouldDeferToNativeForAPIMethodAvailabilityInDevelopment || BuildConfig.EX_UPDATES_NATIVE_DEBUG

        if (launchedUpdate != null) {
          this["updateId"] = launchedUpdate.id.toString()
          this["commitTime"] = launchedUpdate.commitTime.time
          this["manifestString"] = launchedUpdate.manifest.toString()
        }
        val localAssetFiles = constantsForModule.localAssetFiles
        if (localAssetFiles != null) {
          val localAssets = mutableMapOf<String, String>()
          for (asset in localAssetFiles.keys) {
            if (asset.key != null) {
              localAssets[asset.key!!] = localAssetFiles[asset]!!
            }
          }
          this["localAssets"] = localAssets
        }
      }
    }

    OnCreate {
      UpdatesController.bindAppContext(WeakReference(appContext))
    }

    OnStartObserving {
      UpdatesController.shouldEmitJsEvents = true
    }

    OnStopObserving {
      UpdatesController.shouldEmitJsEvents = false
    }

    AsyncFunction("reload") { promise: Promise ->
      UpdatesController.instance.relaunchReactApplicationForModule(
        object : IUpdatesController.ModuleCallback<Unit> {
          override fun onSuccess(result: Unit) {
            promise.resolve(null)
          }

          override fun onFailure(exception: CodedException) {
            promise.reject(exception)
          }
        }
      )
    }

    // Used internally by useUpdates() to get its initial state
    AsyncFunction("getNativeStateMachineContextAsync") { promise: Promise ->
      UpdatesController.instance.getNativeStateMachineContext(object : IUpdatesController.ModuleCallback<UpdatesStateContext> {
        override fun onSuccess(result: UpdatesStateContext) {
          promise.resolve(result.bundle)
        }

        override fun onFailure(exception: CodedException) {
          promise.reject(exception)
        }
      })
    }

    AsyncFunction("checkForUpdateAsync") { promise: Promise ->
      UpdatesController.instance.checkForUpdate(
        object : IUpdatesController.ModuleCallback<IUpdatesController.CheckForUpdateResult> {
          override fun onSuccess(result: IUpdatesController.CheckForUpdateResult) {
            when (result) {
              is IUpdatesController.CheckForUpdateResult.ErrorResult -> {
                promise.reject("ERR_UPDATES_CHECK", result.message, result.error)
                Log.e(TAG, result.message, result.error)
              }
              is IUpdatesController.CheckForUpdateResult.NoUpdateAvailable -> {
                promise.resolve(
                  Bundle().apply {
                    putBoolean("isRollBackToEmbedded", false)
                    putBoolean("isAvailable", false)
                    putString("reason", result.reason.value)
                  }
                )
              }
              is IUpdatesController.CheckForUpdateResult.RollBackToEmbedded -> {
                promise.resolve(
                  Bundle().apply {
                    putBoolean("isRollBackToEmbedded", true)
                    putBoolean("isAvailable", false)
                  }
                )
              }
              is IUpdatesController.CheckForUpdateResult.UpdateAvailable -> {
                promise.resolve(
                  Bundle().apply {
                    putBoolean("isRollBackToEmbedded", false)
                    putBoolean("isAvailable", true)
                    putString(
                      "manifestString",
                      result.update.manifest.toString()
                    )
                  }
                )
              }
            }
          }

          override fun onFailure(exception: CodedException) {
            promise.reject(exception)
          }
        }
      )
    }

    AsyncFunction("fetchUpdateAsync") { promise: Promise ->
      UpdatesController.instance.fetchUpdate(
        object : IUpdatesController.ModuleCallback<IUpdatesController.FetchUpdateResult> {
          override fun onSuccess(result: IUpdatesController.FetchUpdateResult) {
            when (result) {
              is IUpdatesController.FetchUpdateResult.ErrorResult -> {
                promise.reject("ERR_UPDATES_FETCH", "Failed to download new update", result.error)
              }
              is IUpdatesController.FetchUpdateResult.Failure -> {
                promise.resolve(
                  Bundle().apply {
                    putBoolean("isRollBackToEmbedded", false)
                    putBoolean("isNew", false)
                  }
                )
              }
              is IUpdatesController.FetchUpdateResult.RollBackToEmbedded -> {
                promise.resolve(
                  Bundle().apply {
                    putBoolean("isRollBackToEmbedded", true)
                    putBoolean("isNew", false)
                  }
                )
              }
              is IUpdatesController.FetchUpdateResult.Success -> {
                promise.resolve(
                  Bundle().apply {
                    putBoolean("isRollBackToEmbedded", false)
                    putBoolean("isNew", true)
                    putString("manifestString", result.update.manifest.toString())
                  }
                )
              }
            }
          }

          override fun onFailure(exception: CodedException) {
            promise.reject(exception)
          }
        }
      )
    }

    AsyncFunction("getExtraParamsAsync") { promise: Promise ->
      logger.debug("Called getExtraParamsAsync")
      UpdatesController.instance.getExtraParams(object : IUpdatesController.ModuleCallback<Bundle> {
        override fun onSuccess(result: Bundle) {
          promise.resolve(result)
        }

        override fun onFailure(exception: CodedException) {
          promise.reject(exception)
        }
      })
    }

    AsyncFunction("setExtraParamAsync") { key: String, value: String?, promise: Promise ->
      logger.debug("Called setExtraParamAsync with key = $key, value = $value")
      UpdatesController.instance.setExtraParam(
        key,
        value,
        object : IUpdatesController.ModuleCallback<Unit> {
          override fun onSuccess(result: Unit) {
            promise.resolve(null)
          }

          override fun onFailure(exception: CodedException) {
            promise.reject(exception)
          }
        }
      )
    }

    AsyncFunction("readLogEntriesAsync") { maxAge: Long, promise: Promise ->
      AsyncTask.execute {
        promise.resolve(readLogEntries(context, maxAge))
      }
    }

    AsyncFunction("clearLogEntriesAsync") { promise: Promise ->
      AsyncTask.execute {
        clearLogEntries(context) { error ->
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

  companion object {
    private val TAG = UpdatesModule::class.java.simpleName

    internal fun readLogEntries(context: Context, maxAge: Long): List<Bundle> {
      val reader = UpdatesLogReader(context)
      val date = Date()
      val epoch = Date(date.time - maxAge)
      return reader.getLogEntries(epoch)
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
              putStringArray("stacktrace", entry.stacktrace.toTypedArray())
            }
          }
        }
    }

    internal fun clearLogEntries(context: Context, completionHandler: (_: Error?) -> Unit) {
      val reader = UpdatesLogReader(context)
      reader.purgeLogEntries(
        olderThan = Date(),
        completionHandler
      )
    }
  }
}
