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
import expo.modules.updates.statemachine.UpdatesStateEvent
import java.util.Date

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
          constants["manifestString"] =
            if (launchedUpdate.manifest != null) launchedUpdate.manifest.toString() else "{}"
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

              val updateInfo = Bundle()
              if (updateDirective != null) {
                if (updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
                  updateInfo.putBoolean("isRollBackToEmbedded", true)
                  updateInfo.putBoolean("isAvailable", false)
                  promise.resolve(updateInfo)
                  updatesServiceLocal.stateMachine?.processEvent(
                    UpdatesStateEvent.CheckCompleteWithRollback()
                  )
                  return
                }
              }

              if (updateManifest == null) {
                updateInfo.putBoolean("isRollBackToEmbedded", false)
                updateInfo.putBoolean("isAvailable", false)
                promise.resolve(updateInfo)
                updatesServiceLocal.stateMachine?.processEvent(
                  UpdatesStateEvent.CheckCompleteUnavailable()
                )
                return
              }

              val launchedUpdate = updatesServiceLocal.launchedUpdate
              if (launchedUpdate == null) {
                // this shouldn't ever happen, but if we don't have anything to compare
                // the new manifest to, let the user know an update is available
                updateInfo.putBoolean("isRollBackToEmbedded", false)
                updateInfo.putBoolean("isAvailable", true)
                updateInfo.putString("manifestString", updateManifest.manifest.toString())
                promise.resolve(updateInfo)
                updatesServiceLocal.stateMachine?.processEvent(
                  UpdatesStateEvent.CheckCompleteWithUpdate(
                    updateManifest.manifest.getRawJson()
                  )
                )
                return
              }

              if (updatesServiceLocal.selectionPolicy.shouldLoadNewUpdate(
                  updateManifest.updateEntity,
                  launchedUpdate,
                  updateResponse.responseHeaderData?.manifestFilters
                )
              ) {
                updateInfo.putBoolean("isRollBackToEmbedded", false)
                updateInfo.putBoolean("isAvailable", true)
                updateInfo.putString("manifestString", updateManifest.manifest.toString())
                promise.resolve(updateInfo)
                updatesServiceLocal.stateMachine?.processEvent(
                  UpdatesStateEvent.CheckCompleteWithUpdate(
                    updateManifest.manifest.getRawJson()
                  )
                )
              } else {
                updateInfo.putBoolean("isRollBackToEmbedded", false)
                updateInfo.putBoolean("isAvailable", false)
                promise.resolve(updateInfo)
                updatesServiceLocal.stateMachine?.processEvent(
                  UpdatesStateEvent.CheckCompleteUnavailable()
                )
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
        RemoteLoader(
          context,
          updatesServiceLocal.configuration,
          databaseHolder.database,
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

                val updateManifest = updateResponse.manifestUpdateResponsePart?.updateManifest ?: return Loader.OnUpdateResponseLoadedResult(shouldDownloadManifestIfPresentInResponse = false)

                return Loader.OnUpdateResponseLoadedResult(
                  shouldDownloadManifestIfPresentInResponse = updatesServiceLocal.selectionPolicy.shouldLoadNewUpdate(
                    updateManifest.updateEntity,
                    updatesServiceLocal.launchedUpdate,
                    updateResponse.responseHeaderData?.manifestFilters
                  )
                )
              }

              override fun onSuccess(loaderResult: Loader.LoaderResult) {
                databaseHolder.releaseDatabase()
                val updateInfo = Bundle()

                if (loaderResult.updateDirective is UpdateDirective.RollBackToEmbeddedUpdateDirective) {
                  updateInfo.putBoolean("isRollBackToEmbedded", true)
                  updateInfo.putBoolean("isNew", false)

                  updatesServiceLocal.stateMachine?.processEvent(
                    UpdatesStateEvent.DownloadCompleteWithRollback()
                  )
                } else {
                  updateInfo.putBoolean("isRollBackToEmbedded", false)

                  if (loaderResult.updateEntity == null) {
                    updateInfo.putBoolean("isNew", false)
                    updatesServiceLocal.stateMachine?.processEvent(
                      UpdatesStateEvent.DownloadComplete()
                    )
                  } else {
                    updatesServiceLocal.resetSelectionPolicy()
                    updateInfo.putBoolean("isNew", true)

                    // We need the explicit casting here because when in versioned expo-updates,
                    // the UpdateEntity and UpdatesModule are in different package namespace,
                    // Kotlin cannot do the smart casting for that case.
                    val updateEntity = loaderResult.updateEntity as UpdateEntity

                    updateInfo.putString(
                      "manifestString",
                      updateEntity.manifest.toString()
                    )
                    updatesServiceLocal.stateMachine?.processEvent(
                      UpdatesStateEvent.DownloadCompleteWithUpdate(updateEntity.manifest!!)
                    )
                  }
                }

                promise.resolve(updateInfo)
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
