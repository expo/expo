package expo.modules.updates

import android.content.Context
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.Loader
import expo.modules.updates.loader.RemoteLoader
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.LauncherSelectionPolicySingleUpdate
import expo.modules.updates.selectionpolicy.ReaperSelectionPolicyDevelopmentClient
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updatesinterface.UpdatesInterface
import expo.modules.updatesinterface.UpdatesInterface.QueryCallback
import expo.modules.updatesinterface.UpdatesInterface.UpdateCallback
import org.json.JSONObject
import java.util.*

/**
 * Main entry point to expo-updates in development builds with expo-dev-client. Singleton that still
 * makes use of [UpdatesController] for keeping track of updates state, but provides capabilities
 * that are not usually exposed but that expo-dev-client needs (launching and downloading a specific
 * update by URL, allowing dynamic configuration, introspecting the database).
 *
 * Implements the external UpdatesInterface from the expo-updates-interface package. This allows
 * expo-dev-client to compile without needing expo-updates to be installed.
 */
class UpdatesDevLauncherController : UpdatesInterface {
  private var mTempConfiguration: UpdatesConfiguration? = null
  override fun reset() {
    UpdatesController.instance.setLauncher(null)
  }

  /**
   * Fetch an update using a dynamically generated configuration object (including a potentially
   * different update URL than the one embedded in the build).
   */
  override fun fetchUpdateWithConfiguration(
    configuration: HashMap<String, Any>,
    context: Context,
    callback: UpdateCallback
  ) {
    val controller = UpdatesController.instance
    val updatesConfiguration = UpdatesConfiguration(context, configuration)
    if (updatesConfiguration.updateUrl == null || updatesConfiguration.scopeKey == null) {
      callback.onFailure(Exception("Failed to load update: UpdatesConfiguration object must include a valid update URL"))
      return
    }
    if (controller.updatesDirectory == null) {
      callback.onFailure(controller.updatesDirectoryException)
      return
    }

    // since controller is a singleton, save its config so we can reset to it if our request fails
    mTempConfiguration = controller.updatesConfiguration
    setDevelopmentSelectionPolicy()
    controller.updatesConfiguration = updatesConfiguration
    val databaseHolder = controller.databaseHolder
    val loader = RemoteLoader(
      context,
      updatesConfiguration,
      databaseHolder.database,
      controller.fileDownloader,
      controller.updatesDirectory,
      null
    )
    loader.start(object : Loader.LoaderCallback {
      override fun onFailure(e: Exception) {
        databaseHolder.releaseDatabase()
        // reset controller's configuration to what it was before this request
        controller.updatesConfiguration = mTempConfiguration!!
        callback.onFailure(e)
      }

      override fun onSuccess(update: UpdateEntity?) {
        databaseHolder.releaseDatabase()
        if (update == null) {
          callback.onSuccess(null)
          return
        }
        launchUpdate(update, updatesConfiguration, context, callback)
      }

      override fun onAssetLoaded(
        asset: AssetEntity,
        successfulAssetCount: Int,
        failedAssetCount: Int,
        totalAssetCount: Int
      ) {
        callback.onProgress(successfulAssetCount, failedAssetCount, totalAssetCount)
      }

      override fun onUpdateManifestLoaded(updateManifest: UpdateManifest): Boolean {
        return callback.onManifestLoaded(updateManifest.manifest.getRawJson())
      }
    })
  }

  private fun launchUpdate(
    update: UpdateEntity,
    configuration: UpdatesConfiguration,
    context: Context,
    callback: UpdateCallback
  ) {
    val controller = UpdatesController.instance

    // ensure that we launch the update we want, even if it isn't the latest one
    val currentSelectionPolicy = controller.selectionPolicy
    // Calling `setNextSelectionPolicy` allows the Updates module's `reloadAsync` method to reload
    // with a different (newer) update if one is downloaded, e.g. using `fetchUpdateAsync`. If we
    // set the default selection policy here instead, the update we are launching here would keep
    // being launched by `reloadAsync` even if a newer one is downloaded.
    controller.setNextSelectionPolicy(
      SelectionPolicy(
        LauncherSelectionPolicySingleUpdate(update.id),
        currentSelectionPolicy.loaderSelectionPolicy,
        currentSelectionPolicy.reaperSelectionPolicy
      )
    )

    val databaseHolder = controller.databaseHolder
    val launcher = DatabaseLauncher(
      configuration,
      controller.updatesDirectory!!,
      controller.fileDownloader,
      controller.selectionPolicy
    )
    launcher.launch(
      databaseHolder.database, context,
      object : LauncherCallback {
        override fun onFailure(e: Exception) {
          databaseHolder.releaseDatabase()
          // reset controller's configuration to what it was before this request
          controller.updatesConfiguration = mTempConfiguration!!
          callback.onFailure(e)
        }

        override fun onSuccess() {
          databaseHolder.releaseDatabase()
          controller.setLauncher(launcher)
          callback.onSuccess(object : UpdatesInterface.Update {
            override fun getManifest(): JSONObject {
              return launcher.launchedUpdate!!.manifest!!
            }

            override fun getLaunchAssetPath(): String {
              return launcher.launchAssetFile!!
            }
          })
          controller.runReaper()
        }
      }
    )
  }

  override fun storedUpdateIdsWithConfiguration(configuration: HashMap<String, Any>, context: Context, callback: QueryCallback) {
    val controller = UpdatesController.instance
    val updatesConfiguration = UpdatesConfiguration(context, configuration)
    if (updatesConfiguration.updateUrl == null || updatesConfiguration.scopeKey == null) {
      callback.onFailure(Exception("Failed to load update: UpdatesConfiguration object must include a valid update URL"))
      return
    }
    val updatesDirectory = controller.updatesDirectory
    if (updatesDirectory == null) {
      callback.onFailure(controller.updatesDirectoryException)
      return
    }
    val databaseHolder = controller.databaseHolder
    val launcher = DatabaseLauncher(
      updatesConfiguration,
      updatesDirectory,
      controller.fileDownloader,
      controller.selectionPolicy
    )
    val readyUpdateIds = launcher.getReadyUpdateIds(databaseHolder.database)
    controller.databaseHolder.releaseDatabase()
    callback.onSuccess(readyUpdateIds)
  }

  companion object {
    private var singletonInstance: UpdatesDevLauncherController? = null
    val instance: UpdatesDevLauncherController
      get() {
        return checkNotNull(singletonInstance) { "UpdatesDevLauncherController.instance was called before the module was initialized" }
      }

    @JvmStatic fun initialize(context: Context): UpdatesDevLauncherController {
      if (singletonInstance == null) {
        singletonInstance = UpdatesDevLauncherController()
      }
      UpdatesController.initializeWithoutStarting(context)
      return instance
    }

    private fun setDevelopmentSelectionPolicy() {
      val controller = UpdatesController.instance
      controller.resetSelectionPolicyToDefault()
      val currentSelectionPolicy = controller.selectionPolicy
      controller.setDefaultSelectionPolicy(
        SelectionPolicy(
          currentSelectionPolicy.launcherSelectionPolicy,
          currentSelectionPolicy.loaderSelectionPolicy,
          ReaperSelectionPolicyDevelopmentClient()
        )
      )
      controller.resetSelectionPolicyToDefault()
    }
  }
}
