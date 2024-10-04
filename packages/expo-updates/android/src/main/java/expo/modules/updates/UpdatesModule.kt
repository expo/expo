package expo.modules.updates

import android.content.Context
import android.os.AsyncTask
import android.os.Bundle
import android.util.Log
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.ModuleRegistryDelegate
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.*
import expo.modules.updates.loader.FileDownloader.RemoteUpdateDownloadCallback
import expo.modules.updates.logging.UpdatesErrorCode
import expo.modules.updates.logging.UpdatesLogEntry
import expo.modules.updates.logging.UpdatesLogReader
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.statemachine.UpdatesStateContext
import expo.modules.updates.statemachine.UpdatesStateEvent
import java.util.Date
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.manifest.UpdateManifest

// these unused imports must stay because of versioning
/* ktlint-disable no-unused-imports */
import expo.modules.updates.UpdatesConfiguration

/* ktlint-enable no-unused-imports */

/**
 * Exported module which provides to the JS runtime information about the currently running update
 * and updates state, along with methods to check for and download new updates, reload with the
 * newest downloaded update applied, and read/clear native log entries.
 *
 * Communicates with the updates hub ([UpdatesController] in most apps, [ExpoUpdatesAppLoader] in
 * Expo Go and legacy standalone apps) via [UpdatesService], an internal module which is overridden
 * by [UpdatesBinding], a scoped module, in Expo Go.
 */
class UpdatesModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {
  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  private val logger = UpdatesLogger(context)

  private val updatesService: UpdatesInterface? by moduleRegistry()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName(): String {
    return NAME
  }

  override fun getConstants(): Map<String, Any> {
    UpdatesLogger(context).info("UpdatesModule: getConstants called", UpdatesErrorCode.None)
    val constants = mutableMapOf<String, Any>()
    try {
      val updatesServiceLocal: UpdatesInterface? = updatesService
      if (updatesServiceLocal != null) {
        constants["isEmergencyLaunch"] = updatesServiceLocal.isEmergencyLaunch
        constants["isEmbeddedLaunch"] = updatesServiceLocal.isEmbeddedLaunch
        constants["isMissingRuntimeVersion"] =
          updatesServiceLocal.configuration.isMissingRuntimeVersion
        constants["isEnabled"] = updatesServiceLocal.configuration.isEnabled
        constants["releaseChannel"] = updatesServiceLocal.configuration.releaseChannel
        constants["isUsingEmbeddedAssets"] = updatesServiceLocal.isUsingEmbeddedAssets
        constants["runtimeVersion"] = updatesServiceLocal.configuration.runtimeVersion ?: ""
        constants["checkAutomatically"] = updatesServiceLocal.configuration.checkOnLaunch.toJSString()
        constants["channel"] = updatesServiceLocal.configuration.requestHeaders["expo-channel-name"] ?: ""
        constants["nativeDebug"] = BuildConfig.EX_UPDATES_NATIVE_DEBUG

        val launchedUpdate = updatesServiceLocal.launchedUpdate
        if (launchedUpdate != null) {
          constants["updateId"] = launchedUpdate.id.toString()
          constants["commitTime"] = launchedUpdate.commitTime.time
          constants["manifestString"] = launchedUpdate.manifest.toString()
        }
        val localAssetFiles = updatesServiceLocal.localAssetFiles
        if (localAssetFiles != null) {
          val localAssets = mutableMapOf<String, String>()
          for (asset in localAssetFiles.keys) {
            if (asset.key != null) {
              localAssets[asset.key!!] = localAssetFiles[asset]!!
            }
          }
          constants["localAssets"] = localAssets
        }
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
    return constants
  }

  @ExpoMethod
  fun reload(promise: Promise) {
    try {
      val updatesServiceLocal = updatesService
      if (!updatesServiceLocal!!.canRelaunch()) {
        promise.reject(
          "ERR_UPDATES_DISABLED",
          "You cannot reload when expo-updates is not enabled."
        )
        return
      }
      updatesServiceLocal.relaunchReactApplication(object : LauncherCallback {
        override fun onFailure(e: Exception) {
          Log.e(TAG, "Failed to relaunch application", e)
          promise.reject("ERR_UPDATES_RELOAD", e.message, e)
        }

        override fun onSuccess() {
          promise.resolve(null)
        }
      })
    } catch (e: IllegalStateException) {
      promise.reject(
        "ERR_UPDATES_RELOAD",
        "The updates module controller has not been properly initialized. If you're using a development client, you cannot use `Updates.reloadAsync`. Otherwise, make sure you have called the native method UpdatesController.initialize()."
      )
    }
  }

  // Used internally by @expo/use-updates useUpdates() to get its initial state
  @ExpoMethod
  fun getNativeStateMachineContextAsync(promise: Promise) {
    try {
      val updatesServiceLocal = updatesService
      if (!updatesServiceLocal!!.configuration.isEnabled) {
        promise.reject(
          "ERR_UPDATES_DISABLED",
          "You cannot check for updates when expo-updates is not enabled."
        )
        return
      }
      val context = updatesServiceLocal.stateMachine?.context ?: UpdatesStateContext()
      promise.resolve(context.bundle)
    } catch (e: IllegalStateException) {
      promise.reject(
        "ERR_UPDATES_CHECK",
        "The updates module controller has not been properly initialized. If you're using a development client, you cannot check for updates. Otherwise, make sure you have called the native method UpdatesController.initialize()."
      )
    }
  }

  @ExpoMethod
  fun checkForUpdateAsync(promise: Promise) {
    try {
      val updatesServiceLocal = updatesService
      if (!updatesServiceLocal!!.configuration.isEnabled) {
        promise.reject(
          "ERR_UPDATES_DISABLED",
          "You cannot check for updates when expo-updates is not enabled."
        )
        return
      }
      updatesServiceLocal.stateMachine?.processEvent(UpdatesStateEvent.Check())
      AsyncTask.execute {
        val databaseHolder = updatesServiceLocal.databaseHolder
        val extraHeaders = FileDownloader.getExtraHeadersForRemoteUpdateRequest(
          databaseHolder.database,
          updatesServiceLocal.configuration,
          updatesServiceLocal.launchedUpdate,
          updatesServiceLocal.embeddedUpdate
        )
        databaseHolder.releaseDatabase()
        updatesServiceLocal.fileDownloader.downloadRemoteUpdate(
          updatesServiceLocal.configuration,
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

              val launchedUpdate = updatesServiceLocal.launchedUpdate

              if (updateDirective != null) {
                if (updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
                  if (!updatesServiceLocal.configuration.hasEmbeddedUpdate) {
                    promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.NoUpdateAvailable(), updatesServiceLocal)
                    return
                  }

                  val embeddedUpdate = EmbeddedManifest.get(context, updatesServiceLocal.configuration)!!.updateEntity
                  if (embeddedUpdate == null) {
                    promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.NoUpdateAvailable(), updatesServiceLocal)
                    return
                  }

                  if (!updatesServiceLocal.selectionPolicy.shouldLoadRollBackToEmbeddedDirective(
                      updateDirective,
                      embeddedUpdate,
                      launchedUpdate,
                      updateResponse.responseHeaderData?.manifestFilters
                    )
                  ) {
                    promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.NoUpdateAvailable(), updatesServiceLocal)
                    return
                  }

                  promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.RollBackToEmbedded(), updatesServiceLocal)
                  return
                }
              }

              if (updateManifest == null) {
                promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.NoUpdateAvailable(), updatesServiceLocal)
                return
              }

              if (launchedUpdate == null) {
                // this shouldn't ever happen, but if we don't have anything to compare
                // the new manifest to, let the user know an update is available
                promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.UpdateAvailable(updateManifest), updatesServiceLocal)
                return
              }

              if (updatesServiceLocal.selectionPolicy.shouldLoadNewUpdate(
                  updateManifest.updateEntity,
                  launchedUpdate,
                  updateResponse.responseHeaderData?.manifestFilters
                )
              ) {
                promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.UpdateAvailable(updateManifest), updatesServiceLocal)
              } else {
                promise.resolveWithCheckForUpdateAsyncResult(CheckForUpdateAsyncResult.NoUpdateAvailable(), updatesServiceLocal)
              }
            }
          }
        )
      }
    } catch (e: IllegalStateException) {
      promise.reject(
        "ERR_UPDATES_CHECK",
        "The updates module controller has not been properly initialized. If you're using a development client, you cannot check for updates. Otherwise, make sure you have called the native method UpdatesController.initialize()."
      )
    }
  }

  private sealed class CheckForUpdateAsyncResult(private val status: Status) {
    private enum class Status {
      NO_UPDATE_AVAILABLE,
      UPDATE_AVAILABLE,
      ROLL_BACK_TO_EMBEDDED
    }

    class NoUpdateAvailable : CheckForUpdateAsyncResult(Status.NO_UPDATE_AVAILABLE)
    class UpdateAvailable(val updateManifest: UpdateManifest) : CheckForUpdateAsyncResult(Status.UPDATE_AVAILABLE)
    class RollBackToEmbedded : CheckForUpdateAsyncResult(Status.ROLL_BACK_TO_EMBEDDED)
  }

  private fun Promise.resolveWithCheckForUpdateAsyncResult(checkForUpdateAsyncResult: CheckForUpdateAsyncResult, updatesServiceLocal: UpdatesInterface) {
    resolve(
      Bundle().apply {
        when (checkForUpdateAsyncResult) {
          is CheckForUpdateAsyncResult.NoUpdateAvailable -> {
            putBoolean("isRollBackToEmbedded", false)
            putBoolean("isAvailable", false)
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
    updatesServiceLocal.stateMachine?.processEvent(
      when (checkForUpdateAsyncResult) {
        is CheckForUpdateAsyncResult.NoUpdateAvailable -> UpdatesStateEvent.CheckCompleteUnavailable()
        is CheckForUpdateAsyncResult.RollBackToEmbedded -> UpdatesStateEvent.CheckCompleteWithRollback()
        is CheckForUpdateAsyncResult.UpdateAvailable -> UpdatesStateEvent.CheckCompleteWithUpdate(
          checkForUpdateAsyncResult.updateManifest.manifest.getRawJson()
        )
      }
    )
  }

  @ExpoMethod
  fun fetchUpdateAsync(promise: Promise) {
    try {
      val updatesServiceLocal = updatesService
      if (!updatesServiceLocal!!.configuration.isEnabled) {
        promise.reject(
          "ERR_UPDATES_DISABLED",
          "You cannot fetch updates when expo-updates is not enabled."
        )
        return
      }
      updatesServiceLocal.stateMachine?.processEvent(UpdatesStateEvent.Download())
      AsyncTask.execute {
        val databaseHolder = updatesServiceLocal.databaseHolder
        val database = databaseHolder.database
        RemoteLoader(
          context,
          updatesServiceLocal.configuration,
          database,
          updatesServiceLocal.fileDownloader,
          updatesServiceLocal.directory,
          updatesServiceLocal.launchedUpdate
        )
          .start(
            object : Loader.LoaderCallback {
              override fun onFailure(e: Exception) {
                databaseHolder.releaseDatabase()
                promise.reject("ERR_UPDATES_FETCH", "Failed to download new update", e)
                updatesServiceLocal.stateMachine?.processEvent(
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
                  shouldDownloadManifestIfPresentInResponse = updatesServiceLocal.selectionPolicy.shouldLoadNewUpdate(
                    updateManifest.updateEntity,
                    updatesServiceLocal.launchedUpdate,
                    updateResponse.responseHeaderData?.manifestFilters
                  )
                )
              }

              override fun onSuccess(loaderResult: Loader.LoaderResult) {
                RemoteLoader.processSuccessLoaderResult(
                  context,
                  updatesServiceLocal.configuration,
                  database,
                  updatesServiceLocal.selectionPolicy,
                  updatesServiceLocal.directory,
                  updatesServiceLocal.launchedUpdate,
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
                    updatesServiceLocal.stateMachine?.processEvent(
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
                      updatesServiceLocal.stateMachine?.processEvent(
                        UpdatesStateEvent.DownloadComplete()
                      )
                    } else {
                      updatesServiceLocal.resetSelectionPolicy()

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
                      updatesServiceLocal.stateMachine?.processEvent(
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
      promise.reject("ERR_UPDATES_FETCH", message)
    }
  }

  @ExpoMethod
  fun getExtraParamsAsync(promise: Promise) {
    logger.debug("Called getExtraParamsAsync")
    val updatesServiceLocal = updatesService
    if (!updatesServiceLocal!!.configuration.isEnabled) {
      promise.reject(
        "ERR_UPDATES_DISABLED",
        "You cannot get extra params when expo-updates is not enabled."
      )
      return
    }

    AsyncTask.execute {
      val databaseHolder = updatesServiceLocal.databaseHolder
      try {
        val result = ManifestMetadata.getExtraParams(
          databaseHolder.database,
          updatesServiceLocal.configuration,
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
          "Exception in getExtraParamsAsync: ${e.message}, ${e.stackTraceToString()}"
        )
      }
    }
  }

  @ExpoMethod
  fun setExtraParamAsync(key: String, value: String?, promise: Promise) {
    logger.debug("Called setExtraParamAsync with key = $key, value = $value")
    val updatesServiceLocal = updatesService
    if (!updatesServiceLocal!!.configuration.isEnabled) {
      promise.reject(
        "ERR_UPDATES_DISABLED",
        "You cannot set extra client params when expo-updates is not enabled."
      )
      return
    }

    AsyncTask.execute {
      val databaseHolder = updatesServiceLocal.databaseHolder
      try {
        ManifestMetadata.setExtraParam(
          databaseHolder.database,
          updatesServiceLocal.configuration,
          key,
          value
        )
        databaseHolder.releaseDatabase()
        promise.resolve(null)
      } catch (e: Exception) {
        databaseHolder.releaseDatabase()
        promise.reject(
          "ERR_UPDATES_FETCH",
          "Exception in setExtraParamAsync: ${e.message}, ${e.stackTraceToString()}"
        )
      }
    }
  }

  @ExpoMethod
  fun readLogEntriesAsync(maxAge: Long, promise: Promise) {
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
              putStringArray("stacktrace", entry.stacktrace.toTypedArray())
            }
          }
        }
      promise.resolve(results)
    }
  }

  @ExpoMethod
  fun clearLogEntriesAsync(promise: Promise) {
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

  companion object {
    private const val NAME = "ExpoUpdates"

    private val TAG = UpdatesModule::class.java.simpleName
  }
}
