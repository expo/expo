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
import expo.modules.updates.loader.FileDownloader.ManifestDownloadCallback
import expo.modules.updates.loader.Loader
import expo.modules.updates.loader.RemoteLoader
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.manifest.UpdateManifest

// these unused imports must stay because of versioning
/* ktlint-disable no-unused-imports */
import expo.modules.updates.UpdatesConfiguration
/* ktlint-enable no-unused-imports */

class UpdatesModule(
  context: Context,
  private val moduleRegistryDelegate: ModuleRegistryDelegate = ModuleRegistryDelegate()
) : ExportedModule(context) {
  private inline fun <reified T> moduleRegistry() = moduleRegistryDelegate.getFromModuleRegistry<T>()

  private val updatesService: UpdatesInterface? by moduleRegistry()

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    moduleRegistryDelegate.onCreate(moduleRegistry)
  }

  override fun getName(): String {
    return NAME
  }

  override fun getConstants(): Map<String, Any> {
    val constants = mutableMapOf<String, Any>()
    try {
      val updatesServiceLocal: UpdatesInterface? = updatesService
      if (updatesServiceLocal != null) {
        constants["isEmergencyLaunch"] = updatesServiceLocal.isEmergencyLaunch
        constants["isMissingRuntimeVersion"] =
          updatesServiceLocal.configuration.isMissingRuntimeVersion
        constants["isEnabled"] = updatesServiceLocal.configuration.isEnabled
        constants["releaseChannel"] = updatesServiceLocal.configuration.releaseChannel
        constants["isUsingEmbeddedAssets"] = updatesServiceLocal.isUsingEmbeddedAssets
        constants["runtimeVersion"] = updatesServiceLocal.configuration.runtimeVersion ?: ""
        constants["channel"] = updatesServiceLocal.configuration.requestHeaders["expo-channel-name"] ?: ""

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
      val configuration = UpdatesConfiguration().loadValuesFromMetadata(context)
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
      val databaseHolder = updatesServiceLocal.databaseHolder
      val extraHeaders = ManifestMetadata.getServerDefinedHeaders(
        databaseHolder.database, updatesServiceLocal.configuration
      )
      databaseHolder.releaseDatabase()
      updatesServiceLocal.fileDownloader.downloadManifest(
        updatesServiceLocal.configuration,
        extraHeaders,
        context,
        object : ManifestDownloadCallback {
          override fun onFailure(message: String, e: Exception) {
            promise.reject("ERR_UPDATES_CHECK", message, e)
            Log.e(TAG, message, e)
          }

          override fun onSuccess(updateManifest: UpdateManifest) {
            val launchedUpdate = updatesServiceLocal.launchedUpdate
            val updateInfo = Bundle()
            if (launchedUpdate == null) {
              // this shouldn't ever happen, but if we don't have anything to compare
              // the new manifest to, let the user know an update is available
              updateInfo.putBoolean("isAvailable", true)
              updateInfo.putString("manifestString", updateManifest.manifest.toString())
              promise.resolve(updateInfo)
              return
            }
            if (updatesServiceLocal.selectionPolicy.shouldLoadNewUpdate(
                updateManifest.updateEntity,
                launchedUpdate,
                updateManifest.manifestFilters
              )
            ) {
              updateInfo.putBoolean("isAvailable", true)
              updateInfo.putString("manifestString", updateManifest.manifest.toString())
              promise.resolve(updateInfo)
            } else {
              updateInfo.putBoolean("isAvailable", false)
              promise.resolve(updateInfo)
            }
          }
        }
      )
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
      AsyncTask.execute {
        val databaseHolder = updatesServiceLocal.databaseHolder
        RemoteLoader(
          context,
          updatesServiceLocal.configuration,
          databaseHolder.database,
          updatesServiceLocal.fileDownloader,
          updatesServiceLocal.directory
        )
          .start(
            object : Loader.LoaderCallback {
              override fun onFailure(e: Exception) {
                databaseHolder.releaseDatabase()
                promise.reject("ERR_UPDATES_FETCH", "Failed to download new update", e)
              }

              override fun onAssetLoaded(
                asset: AssetEntity,
                successfulAssetCount: Int,
                failedAssetCount: Int,
                totalAssetCount: Int
              ) {
              }

              override fun onUpdateManifestLoaded(updateManifest: UpdateManifest): Boolean {
                return updatesServiceLocal.selectionPolicy.shouldLoadNewUpdate(
                  updateManifest.updateEntity,
                  updatesServiceLocal.launchedUpdate,
                  updateManifest.manifestFilters
                )
              }

              override fun onSuccess(update: UpdateEntity?) {
                databaseHolder.releaseDatabase()
                val updateInfo = Bundle()
                if (update == null) {
                  updateInfo.putBoolean("isNew", false)
                } else {
                  updatesServiceLocal.resetSelectionPolicy()
                  updateInfo.putBoolean("isNew", true)
                  updateInfo.putString("manifestString", update.manifest.toString())
                }
                promise.resolve(updateInfo)
              }
            }
          )
      }
    } catch (e: IllegalStateException) {
      promise.reject(
        "ERR_UPDATES_FETCH",
        "The updates module controller has not been properly initialized. If you're using a development client, you cannot fetch updates. Otherwise, make sure you have called the native method UpdatesController.initialize()."
      )
    }
  }

  companion object {
    private const val NAME = "ExpoUpdates"

    private val TAG = UpdatesModule::class.java.simpleName
  }
}
