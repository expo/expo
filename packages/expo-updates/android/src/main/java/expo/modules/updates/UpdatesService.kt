package expo.modules.updates

import android.content.Context
import expo.modules.core.interfaces.InternalModule
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.selectionpolicy.SelectionPolicy
import java.io.File

// these unused imports must stay because of versioning
/* ktlint-disable no-unused-imports */
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesController
/* ktlint-enable no-unused-imports */

open class UpdatesService(protected var context: Context) : InternalModule, UpdatesInterface {
  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf(UpdatesInterface::class.java as Class<*>)
  }

  override val configuration: UpdatesConfiguration
    get() = UpdatesController.instance.updatesConfiguration
  override val selectionPolicy: SelectionPolicy
    get() = UpdatesController.instance.selectionPolicy
  override val directory: File?
    get() = UpdatesController.instance.updatesDirectory
  override val fileDownloader: FileDownloader
    get() = UpdatesController.instance.fileDownloader
  override val databaseHolder: DatabaseHolder
    get() = UpdatesController.instance.databaseHolder
  override val isEmergencyLaunch: Boolean
    get() = UpdatesController.instance.isEmergencyLaunch
  override val isUsingEmbeddedAssets: Boolean
    get() = UpdatesController.instance.isUsingEmbeddedAssets

  override fun canRelaunch(): Boolean {
    return configuration.isEnabled && launchedUpdate != null
  }

  override val launchedUpdate: UpdateEntity?
    get() = UpdatesController.instance.launchedUpdate
  override val localAssetFiles: Map<AssetEntity, String>?
    get() = UpdatesController.instance.localAssetFiles

  override fun relaunchReactApplication(callback: LauncherCallback) {
    UpdatesController.instance.relaunchReactApplication(context, callback)
  }

  override fun resetSelectionPolicy() {
    UpdatesController.instance.resetSelectionPolicyToDefault()
  }

  companion object {
    private val TAG = UpdatesService::class.java.simpleName
  }
}
