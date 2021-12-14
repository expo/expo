package expo.modules.updates

import android.content.Context
import expo.modules.manifests.core.Manifest.Companion.fromManifestJson
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.DatabaseLauncher
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.Loader
import expo.modules.updates.loader.RemoteLoader
import expo.modules.updates.manifest.UpdateManifest
import expo.modules.updates.selectionpolicy.ReaperSelectionPolicyDevelopmentClient
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updatesinterface.UpdatesInterface
import org.json.JSONObject
import java.util.*

// this unused import must stay because of versioning
/* ktlint-disable no-unused-imports */

/* ktlint-enable no-unused-imports */

class UpdatesDevLauncherController : UpdatesInterface {
  private var mTempConfiguration: UpdatesConfiguration? = null
  override fun reset() {
    UpdatesController.instance.setLauncher(null)
  }

  override fun fetchUpdateWithConfiguration(
    configuration: HashMap<String, Any>,
    context: Context,
    callback: UpdatesInterface.UpdateCallback
  ) {
    val controller = UpdatesController.instance
    val updatesConfiguration = UpdatesConfiguration()
      .loadValuesFromMetadata(context)
      .loadValuesFromMap(configuration)
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
      controller.updatesDirectory
    )
    loader.start(object : Loader.LoaderCallback {
      override fun onFailure(e: Exception) {
        databaseHolder.releaseDatabase()
        callback.onFailure(e)
      }

      override fun onSuccess(update: UpdateEntity?) {
        databaseHolder.releaseDatabase()
        if (update == null) {
          callback.onSuccess(null)
          return
        }
        launchNewestUpdate(updatesConfiguration, context, callback)
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

  private fun launchNewestUpdate(
    configuration: UpdatesConfiguration,
    context: Context,
    callback: UpdatesInterface.UpdateCallback
  ) {
    val controller = UpdatesController.instance
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
          callback.onFailure(e)
          // reset controller's configuration to what it was before this request
          controller.updatesConfiguration = mTempConfiguration!!
        }

        override fun onSuccess() {
          databaseHolder.releaseDatabase()
          controller.setLauncher(launcher)
          callback.onSuccess(object : UpdatesInterface.Update {
            override fun getManifest(): JSONObject {
              val manifest = fromManifestJson(
                launcher.launchedUpdate!!.manifest!!
              )
              return manifest.getRawJson()
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
