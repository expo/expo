package expo.modules.updates

import android.content.Context
import android.net.Uri
import android.os.Bundle
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable
import expo.modules.updates.events.IUpdatesEventManagerObserver
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogEntry
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.statemachine.UpdatesStateContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.lang.ref.WeakReference
import java.util.Date

enum class UpdatesJSEvent(val eventName: String) : Enumerable {
  StateChange("Expo.nativeUpdatesStateChangeEvent")
}

/**
 * Exported module which provides to the JS runtime information about the currently running update
 * and updates state, along with methods to check for and download new updates, reload with the
 * newest downloaded update applied, and read/clear native log entries.
 */
class UpdatesModule : Module(), IUpdatesEventManagerObserver {
  private val logger: UpdatesLogger
    get() = UpdatesLogger(context.filesDir)

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("ExpoUpdates")

    Events<UpdatesJSEvent>()

    Constants {
      UpdatesLogger(context.filesDir).info("UpdatesModule: getConstants called", UpdatesErrorCode.None)
      UpdatesController.instance.getConstantsForModule().toModuleConstantsMap()
    }

    OnStartObserving(UpdatesJSEvent.StateChange) {
      UpdatesController.setUpdatesEventManagerObserver(WeakReference(this@UpdatesModule))
    }

    OnStopObserving(UpdatesJSEvent.StateChange) {
      UpdatesController.removeUpdatesEventManagerObserver()
    }

    OnDestroy {
      UpdatesController.removeUpdatesEventManagerObserver()
    }

    AsyncFunction("reload") Coroutine { ->
      UpdatesController.instance.relaunchReactApplicationForModule()
    }

    AsyncFunction("checkForUpdateAsync") Coroutine { ->
      when (val result = UpdatesController.instance.checkForUpdate()) {
        is IUpdatesController.CheckForUpdateResult.ErrorResult -> {
          throw CodedException("ERR_UPDATES_CHECK", "Failed to check for update", result.error)
        }

        is IUpdatesController.CheckForUpdateResult.NoUpdateAvailable -> {
          Bundle().apply {
            putBoolean("isRollBackToEmbedded", false)
            putBoolean("isAvailable", false)
            putString("reason", result.reason.value)
          }
        }

        is IUpdatesController.CheckForUpdateResult.RollBackToEmbedded -> {
          Bundle().apply {
            putBoolean("isRollBackToEmbedded", true)
            putBoolean("isAvailable", false)
          }
        }

        is IUpdatesController.CheckForUpdateResult.UpdateAvailable -> {
          Bundle().apply {
            putBoolean("isRollBackToEmbedded", false)
            putBoolean("isAvailable", true)
            putString(
              "manifestString",
              result.update.manifest.toString()
            )
          }
        }
      }
    }

    AsyncFunction("fetchUpdateAsync") Coroutine { ->
      when (val result = UpdatesController.instance.fetchUpdate()) {
        is IUpdatesController.FetchUpdateResult.ErrorResult -> {
          throw CodedException("ERR_UPDATES_FETCH", "Failed to download new update", result.error)
        }

        is IUpdatesController.FetchUpdateResult.Failure -> {
          Bundle().apply {
            putBoolean("isRollBackToEmbedded", false)
            putBoolean("isNew", false)
          }
        }

        is IUpdatesController.FetchUpdateResult.RollBackToEmbedded -> {
          Bundle().apply {
            putBoolean("isRollBackToEmbedded", true)
            putBoolean("isNew", false)
          }
        }

        is IUpdatesController.FetchUpdateResult.Success -> {
          Bundle().apply {
            putBoolean("isRollBackToEmbedded", false)
            putBoolean("isNew", true)
            putString("manifestString", result.update.manifest.toString())
          }
        }
      }
    }

    AsyncFunction("getExtraParamsAsync") Coroutine { ->
      logger.debug("Called getExtraParamsAsync")
      return@Coroutine UpdatesController.instance.getExtraParams()
    }

    AsyncFunction("setExtraParamAsync") Coroutine { key: String, value: String? ->
      logger.debug("Called setExtraParamAsync with key = $key, value = $value")
      UpdatesController.instance.setExtraParam(
        key,
        value
      )
    }

    AsyncFunction("readLogEntriesAsync") Coroutine { maxAge: Long ->
      return@Coroutine readLogEntries(context.filesDir, maxAge)
    }

    AsyncFunction("clearLogEntriesAsync") Coroutine { ->
      clearLogEntries(context.filesDir) { error ->
        if (error != null) {
          throw CodedException(
            "ERR_UPDATES_READ_LOGS",
            "There was an error when clearing the expo-updates log file",
            error
          )
        }
      }
    }

    Function("setUpdateURLAndRequestHeadersOverride") { configOverride: UpdatesConfigurationOverrideParam? ->
      UpdatesController.instance.setUpdateURLAndRequestHeadersOverride(configOverride?.toUpdatesConfigurationOverride())
    }
  }

  companion object {
    private val TAG = UpdatesModule::class.java.simpleName

    internal suspend fun readLogEntries(filesDirectory: File, maxAge: Long) =
      withContext(Dispatchers.IO) {
        val reader = UpdatesLogReader(filesDirectory)
        val date = Date()
        val epoch = Date(date.time - maxAge)
        reader.getLogEntries(epoch)
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

    internal suspend fun clearLogEntries(filesDirectory: File, completionHandler: (_: Exception?) -> Unit) {
      val reader = UpdatesLogReader(filesDirectory)
      reader.purgeLogEntries(
        olderThan = Date(),
        completionHandler
      )
    }
  }

  override fun onStateMachineContextEvent(context: UpdatesStateContext) {
    sendEvent(UpdatesJSEvent.StateChange, Bundle().apply { putBundle("context", context.bundle) })
  }

  internal data class UpdatesConfigurationOverrideParam(
    @Field val updateUrl: Uri,
    @Field val requestHeaders: Map<String, String>
  ) : Record {
    fun toUpdatesConfigurationOverride(): UpdatesConfigurationOverride {
      return UpdatesConfigurationOverride(updateUrl, requestHeaders)
    }
  }
}
