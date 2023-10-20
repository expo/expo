package expo.modules.updates

import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import android.util.Log
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.*
import expo.modules.updates.loader.FileDownloader.RemoteUpdateDownloadCallback
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogEntry
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.statemachine.UpdatesStateEvent
import java.lang.Error
import java.util.Date

// these unused imports must stay because of versioning
/* ktlint-disable no-unused-imports */

/* ktlint-enable no-unused-imports */

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

    Constants {
      UpdatesLogger(context).info("UpdatesModule: getConstants called", UpdatesErrorCode.None)
      val constants = mutableMapOf<String, Any>()
      try {
        val updatesController = UpdatesController.instance
        val configuration = updatesController.updatesConfiguration
        val launchedUpdate = updatesController.launchedUpdate
        val embeddedUpdate = EmbeddedManifest.get(context, configuration)?.updateEntity
        val isEmbeddedLaunch = launchedUpdate?.id?.equals(embeddedUpdate?.id) ?: false

        constants["isEmergencyLaunch"] = updatesController.isEmergencyLaunch
        constants["isEmbeddedLaunch"] = isEmbeddedLaunch
        constants["isMissingRuntimeVersion"] = configuration.isMissingRuntimeVersion
        constants["isEnabled"] = configuration.isEnabled
        constants["releaseChannel"] = configuration.releaseChannel
        constants["isUsingEmbeddedAssets"] = updatesController.isUsingEmbeddedAssets
        constants["runtimeVersion"] = configuration.runtimeVersion ?: ""
        constants["checkAutomatically"] = configuration.checkOnLaunch.toJSString()
        constants["channel"] = configuration.requestHeaders["expo-channel-name"] ?: ""
        constants["nativeDebug"] = BuildConfig.EX_UPDATES_NATIVE_DEBUG

        if (launchedUpdate != null) {
          constants["updateId"] = launchedUpdate.id.toString()
          constants["commitTime"] = launchedUpdate.commitTime.time
          constants["manifestString"] = launchedUpdate.manifest.toString()
        }
        val localAssetFiles = updatesController.localAssetFiles
        if (localAssetFiles != null) {
          val localAssets = mutableMapOf<String, String>()
          for (asset in localAssetFiles.keys) {
            if (asset.key != null) {
              localAssets[asset.key!!] = localAssetFiles[asset]!!
            }
          }
          constants["localAssets"] = localAssets
        }
      } catch (e: Exception) {
        // do nothing; this is expected in a development client
        constants["isEnabled"] = false

        // In a development client, we normally don't have access to the updates configuration, but
        // we should attempt to see if the runtime/sdk versions are defined in AndroidManifest.xml
        // and warn the developer if not. This does not take into account any extra configuration
        // provided at runtime in MainApplication.java, because we don't have access to that in a
        // debug build.
        val configuration = UpdatesConfiguration(context, null)
        constants["isMissingRuntimeVersion"] = configuration.isMissingRuntimeVersion
      }
      constants
    }

    AsyncFunction("reload") { promise: Promise ->
      try {
        val updatesController = UpdatesController.instance
        val configuration = updatesController.updatesConfiguration
        val launchedUpdate = updatesController.launchedUpdate
        val canRelaunch = configuration.isEnabled && launchedUpdate != null
        if (!canRelaunch) {
          promise.reject(
            "ERR_UPDATES_DISABLED",
            "You cannot reload when expo-updates is not enabled.",
            null
          )
        } else {
          updatesController.relaunchReactApplication(
            context,
            object : LauncherCallback {
              override fun onFailure(e: Exception) {
                Log.e(TAG, "Failed to relaunch application", e)
                promise.reject("ERR_UPDATES_RELOAD", e.message, e)
              }

              override fun onSuccess() {
                promise.resolve(null)
              }
            }
          )
        }
      } catch (e: IllegalStateException) {
        promise.reject(
          "ERR_UPDATES_RELOAD",
          "The updates module controller has not been properly initialized. If you're using a development client, you cannot use `Updates.reloadAsync`. Otherwise, make sure you have called the native method UpdatesController.initialize().",
          e
        )
      }
    }

    // Used internally by useUpdates() to get its initial state
    AsyncFunction("getNativeStateMachineContextAsync") { promise: Promise ->
      try {
        val updatesController = UpdatesController.instance
        val configuration = updatesController.updatesConfiguration
        if (!configuration.isEnabled) {
          promise.reject(
            "ERR_UPDATES_DISABLED",
            "You cannot check for updates when expo-updates is not enabled.",
            null
          )
        } else {
          val context = updatesController.stateMachine.context
          promise.resolve(context.bundle)
        }
      } catch (e: IllegalStateException) {
        promise.reject(
          "ERR_UPDATES_CHECK",
          "The updates module controller has not been properly initialized. If you're using a development client, you cannot check for updates. Otherwise, make sure you have called the native method UpdatesController.initialize().",
          e
        )
      }
    }

    AsyncFunction("checkForUpdateAsync") { promise: Promise ->
      try {
        val updatesController = UpdatesController.instance
        val configuration = updatesController.updatesConfiguration
        if (!configuration.isEnabled) {
          promise.reject(
            "ERR_UPDATES_DISABLED",
            "You cannot check for updates when expo-updates is not enabled.",
            null
          )
          return@AsyncFunction
        }
        updatesController.stateMachine.processEvent(UpdatesStateEvent.Check())
        AsyncTask.execute {
          val databaseHolder = updatesController.databaseHolder
          val embeddedUpdate = EmbeddedManifest.get(context, configuration)?.updateEntity
          val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(
            databaseHolder.database,
            configuration,
            updatesController.launchedUpdate,
            embeddedUpdate
          )
          databaseHolder.releaseDatabase()
          updatesController.fileDownloader.downloadRemoteUpdate(
            configuration,
            extraHeaders,
            context,
            object : RemoteUpdateDownloadCallback {
              override fun onFailure(message: String, e: Exception) {
                promise.reject("ERR_UPDATES_CHECK", message, e)
                Log.e(TAG, message, e)
              }

              override fun onSuccess(updateResponse: UpdateResponse) {
                val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
                val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest

                val launchedUpdate = updatesController.launchedUpdate

                if (updateDirective != null) {
                  if (updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
                    if (!configuration.hasEmbeddedUpdate) {
                      promise.resolveWithCheckForUpdateAsyncResult(
                        CheckForUpdateAsyncResult.NoUpdateAvailable(
                          LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED
                        ),
                        updatesController
                      )
                      return
                    }

                    if (embeddedUpdate == null) {
                      promise.resolveWithCheckForUpdateAsyncResult(
                        CheckForUpdateAsyncResult.NoUpdateAvailable(
                          LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_NO_EMBEDDED
                        ),
                        updatesController
                      )
                      return
                    }

                    if (!updatesController.selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
                        updateDirective,
                        embeddedUpdate,
                        launchedUpdate,
                        updateResponse.responseHeaderData?.manifestFilters
                      )
                    ) {
                      promise.resolveWithCheckForUpdateAsyncResult(
                        CheckForUpdateAsyncResult.NoUpdateAvailable(
                          LoaderTask.RemoteCheckResultNotAvailableReason.ROLLBACK_REJECTED_BY_SELECTION_POLICY
                        ),
                        updatesController
                      )
                      return
                    }

                    promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.RollBackToEmbedded(updateDirective.commitTime), updatesController)
                    return
                  }
                }

                if (updateManifest == null) {
                  promise.resolveWithCheckForUpdateAsyncResult(
                    CheckForUpdateAsyncResult.NoUpdateAvailable(
                      LoaderTask.RemoteCheckResultNotAvailableReason.NO_UPDATE_AVAILABLE_ON_SERVER
                    ),
                    updatesController
                  )
                  return
                }

                if (launchedUpdate == null) {
                  // this shouldn't ever happen, but if we don't have anything to compare
                  // the new manifest to, let the user know an update is available
                  promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.UpdateAvailable(updateManifest), updatesController)
                  return
                }

                var shouldLaunch = false
                var failedPreviously = false
                if (updatesController.selectionPolicy.shouldLoadNewUpdate(
                    updateManifest.updateEntity,
                    launchedUpdate,
                    updateResponse.responseHeaderData?.manifestFilters
                  )
                ) {
                  // If "update" has failed to launch previously, then
                  // "launchedUpdate" will be an earlier update, and the test above
                  // will return true (incorrectly).
                  // We check to see if the new update is already in the DB, and if so,
                  // only allow the update if it has had no launch failures.
                  shouldLaunch = true
                  updateManifest.updateEntity?.let { updateEntity ->
                    val storedUpdateEntity = updatesController.databaseHolder.database.updateDao().loadUpdateWithId(
                      updateEntity.id
                    )
                    updatesController.databaseHolder.releaseDatabase()
                    storedUpdateEntity?.let { storedUpdateEntity ->
                      shouldLaunch = storedUpdateEntity.failedLaunchCount == 0
                      logger.info("Stored update found: ID = ${updateEntity.id}, failureCount = ${storedUpdateEntity.failedLaunchCount}")
                      failedPreviously = !shouldLaunch
                    }
                  }
                }
                if (shouldLaunch) {
                  promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.UpdateAvailable(updateManifest), updatesController)
                } else {
                  val reason = when (failedPreviously) {
                    true -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_PREVIOUSLY_FAILED
                    else -> LoaderTask.RemoteCheckResultNotAvailableReason.UPDATE_REJECTED_BY_SELECTION_POLICY
                  }
                  promise.resolveWithCheckForUpdateAsyncResult(
                    CheckForUpdateAsyncResult.NoUpdateAvailable(reason),
                    updatesController
                  )
                }
              }
            }
          )
        }
      } catch (e: IllegalStateException) {
        promise.reject(
          "ERR_UPDATES_CHECK",
          "The updates module controller has not been properly initialized. If you're using a development client, you cannot check for updates. Otherwise, make sure you have called the native method UpdatesController.initialize().",
          e
        )
      }
    }

    AsyncFunction("fetchUpdateAsync") { promise: Promise ->
      try {
        val updatesController = UpdatesController.instance
        val configuration = updatesController.updatesConfiguration
        if (!configuration.isEnabled) {
          promise.reject(
            "ERR_UPDATES_DISABLED",
            "You cannot fetch updates when expo-updates is not enabled.",
            null
          )
          return@AsyncFunction
        }
        updatesController.stateMachine.processEvent(UpdatesStateEvent.Download())
        AsyncTask.execute {
          val databaseHolder = updatesController.databaseHolder
          val database = databaseHolder.database
          RemoteLoader(
            context,
            configuration,
            database,
            updatesController.fileDownloader,
            updatesController.updatesDirectory,
            updatesController.launchedUpdate
          )
            .start(
              object : Loader.LoaderCallback {
                override fun onFailure(e: Exception) {
                  databaseHolder.releaseDatabase()
                  promise.reject("ERR_UPDATES_FETCH", "Failed to download new update", e)
                  updatesController.stateMachine.processEvent(
                    UpdatesStateEvent.DownloadError("Failed to download new update: ${e.message}")
                  )
                }

                override fun onAssetLoaded(
                  asset: AssetEntity,
                  successfulAssetCount: Int,
                  failedAssetCount: Int,
                  totalAssetCount: Int
                ) {
                }

                override fun onUpdateResponseLoaded(updateResponse: UpdateResponse): Loader.OnUpdateResponseLoadedResult {
                  val updateDirective = updateResponse.directiveUpdateResponsePart?.updateDirective
                  if (updateDirective != null) {
                    return Loader.OnUpdateResponseLoadedResult(
                      shouldDownloadManifestIfPresentInResponse = when (updateDirective) {
                        is UpdateDirective.RollBackToEmbeddedUpdateDirective -> false
                        is UpdateDirective.NoUpdateAvailableUpdateDirective -> false
                      }
                    )
                  }

                  val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest
                    ?: return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)

                  return Loader.OnUpdateResponseLoadedResult(
                    shouldDownloadManifestIfPresentInResponse = updatesController.selectionPolicy.shouldLoadNewUpdate(
                      updateManifest.updateEntity,
                      updatesController.launchedUpdate,
                      updateResponse.responseHeaderData?.manifestFilters
                    )
                  )
                }

                override fun onSuccess(loaderResult: Loader.LoaderResult) {
                  RemoteLoader.processSuccessLoaderResult(
                    context,
                    configuration,
                    database,
                    updatesController.selectionPolicy,
                    updatesController.updatesDirectory,
                    updatesController.launchedUpdate,
                    loaderResult
                  ) { availableUpdate, didRollBackToEmbedded ->
                    databaseHolder.releaseDatabase()

                    if (didRollBackToEmbedded) {
                      promise.resolve(
                        Bundle().apply {
                          putBoolean("isRollBackToEmbedded", true)
                          putBoolean("isNew", false)
                        }
                      )
                      updatesController.stateMachine.processEvent(
                        UpdatesStateEvent.DownloadCompleteWithRollback()
                      )
                    } else {
                      if (availableUpdate == null) {
                        promise.resolve(
                          Bundle().apply {
                            putBoolean("isRollBackToEmbedded", false)
                            putBoolean("isNew", false)
                          }
                        )
                        updatesController.stateMachine.processEvent(
                          UpdatesStateEvent.DownloadComplete()
                        )
                      } else {
                        updatesController.resetSelectionPolicyToDefault()

                        // We need the explicit casting here because when in versioned expo-updates,
                        // the UpdateEntity and UpdatesModule are in different package namespace,
                        // Kotlin cannot do the smart casting for that case.
                        val updateEntity = loaderResult.updateEntity as UpdateEntity

                        promise.resolve(
                          Bundle().apply {
                            putBoolean("isRollBackToEmbedded", false)
                            putBoolean("isNew", true)
                            putString("manifestString", updateEntity.manifest.toString())
                          }
                        )
                        updatesController.stateMachine.processEvent(
                          UpdatesStateEvent.DownloadCompleteWithUpdate(updateEntity.manifest)
                        )
                      }
                    }
                  }
                }
              }
            )
        }
      } catch (e: IllegalStateException) {
        val message = "The updates module controller has not been properly initialized. If you're using a development client, you cannot fetch updates. Otherwise, make sure you have called the native method UpdatesController.initialize()."
        promise.reject("ERR_UPDATES_FETCH", message, e)
      }
    }

    AsyncFunction("getExtraParamsAsync") { promise: Promise ->
      logger.debug("Called getExtraParamsAsync")
      val updatesController = UpdatesController.instance
      val configuration = updatesController.updatesConfiguration
      if (!configuration.isEnabled) {
        promise.reject(
          "ERR_UPDATES_DISABLED",
          "You cannot get extra params when expo-updates is not enabled.",
          null
        )
        return@AsyncFunction
      }

      AsyncTask.execute {
        val databaseHolder = updatesController.databaseHolder
        try {
          val result = ManifestMetadata.getExtraParams(
            databaseHolder.database,
            configuration,
          )
          databaseHolder.releaseDatabase()
          val resultMap = when (result) {
            null -> Bundle()
            else -> {
              Bundle().apply {
                result.forEach {
                  putString(it.key, it.value)
                }
              }
            }
          }
          promise.resolve(resultMap)
        } catch (e: Exception) {
          databaseHolder.releaseDatabase()
          promise.reject(
            "ERR_UPDATES_FETCH",
            "Exception in getExtraParamsAsync: ${e.message}, ${e.stackTraceToString()}",
            e
          )
        }
      }
    }

    AsyncFunction("setExtraParamAsync") { key: String, value: String?, promise: Promise ->
      logger.debug("Called setExtraParamAsync with key = $key, value = $value")
      val updatesController = UpdatesController.instance
      val configuration = updatesController.updatesConfiguration
      if (!configuration.isEnabled) {
        promise.reject(
          "ERR_UPDATES_DISABLED",
          "You cannot set extra client params when expo-updates is not enabled.",
          null
        )
        return@AsyncFunction
      }

      AsyncTask.execute {
        val databaseHolder = updatesController.databaseHolder
        try {
          ManifestMetadata.setExtraParam(
            databaseHolder.database,
            configuration,
            key,
            value
          )
          databaseHolder.releaseDatabase()
          promise.resolve(null)
        } catch (e: Exception) {
          databaseHolder.releaseDatabase()
          promise.reject(
            "ERR_UPDATES_FETCH",
            "Exception in setExtraParamAsync: ${e.message}, ${e.stackTraceToString()}",
            e
          )
        }
      }
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

  private sealed class CheckForUpdateAsyncResult(private val status: Status) {
    private enum class Status {
      NO_UPDATE_AVAILABLE,
      UPDATE_AVAILABLE,
      ROLL_BACK_TO_EMBEDDED
    }

    class NoUpdateAvailable(val reason: LoaderTask.RemoteCheckResultNotAvailableReason) : CheckForUpdateAsyncResult(Status.NO_UPDATE_AVAILABLE)
    class UpdateAvailable(val updateManifest: UpdateManifest) : CheckForUpdateAsyncResult(Status.UPDATE_AVAILABLE)
    class RollBackToEmbedded(val commitTime: Date) : CheckForUpdateAsyncResult(Status.ROLL_BACK_TO_EMBEDDED)
  }

  private fun Promise.resolveWithCheckForUpdateAsyncResult(checkForUpdateAsyncResult: CheckForUpdateAsyncResult, updatesController: UpdatesController) {
    resolve(
      Bundle().apply {
        when (checkForUpdateAsyncResult) {
          is CheckForUpdateAsyncResult.NoUpdateAvailable -> {
            putBoolean("isRollBackToEmbedded", false)
            putBoolean("isAvailable", false)
            putString("reason", checkForUpdateAsyncResult.reason.value)
          }

          is CheckForUpdateAsyncResult.RollBackToEmbedded -> {
            putBoolean("isRollBackToEmbedded", true)
            putBoolean("isAvailable", false)
          }

          is CheckForUpdateAsyncResult.UpdateAvailable -> {
            putBoolean("isRollBackToEmbedded", false)
            putBoolean("isAvailable", true)
            putString("manifestString", checkForUpdateAsyncResult.updateManifest.manifest.toString())
          }
        }
      }
    )
    updatesController.stateMachine.processEvent(
      when (checkForUpdateAsyncResult) {
        is CheckForUpdateAsyncResult.NoUpdateAvailable -> UpdatesStateEvent.CheckCompleteUnavailable()
        is CheckForUpdateAsyncResult.RollBackToEmbedded -> UpdatesStateEvent.CheckCompleteWithRollback(checkForUpdateAsyncResult.commitTime)
        is CheckForUpdateAsyncResult.UpdateAvailable -> UpdatesStateEvent.CheckCompleteWithUpdate(
          checkForUpdateAsyncResult.updateManifest.manifest.getRawJson()
        )
      }
    )
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
