package expo.modules.updates

import android.content.Context
import expo.modules.core.interfaces.InternalModule
import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.manifest.EmbeddedManifest
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateMachine
import java.io.File

// these unused imports must stay because of versioning
/* ktlint-disable no-unused-imports */
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesController

/* ktlint-enable no-unused-imports */

/**
 * Internal module whose purpose is to connect [UpdatesModule] with the central updates entry point.
 * In most apps, this is [UpdatesController].
 *
 * In other cases, this module can be overridden at runtime to redirect [UpdatesModule] to a
 * different entry point. This is the case in Expo Go, where this module is overridden by
 * [UpdatesBinding] in order to get data from [ExpoUpdatesAppLoader].
 */
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
  override val isEmbeddedLaunch: Boolean
    get() = launchedUpdate?.id?.equals(embeddedUpdate?.id) ?: false
  override val isUsingEmbeddedAssets: Boolean
    get() = UpdatesController.instance.isUsingEmbeddedAssets
  override val stateMachine: UpdatesStateMachine?
    get() = UpdatesController.instance.stateMachine

  override fun canRelaunch(): Boolean {
    return configuration.isEnabled && launchedUpdate != null
  }

  override val embeddedUpdate: UpdateEntity?
    get() = EmbeddedManifest.get(context, configuration)?.updateEntity
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
