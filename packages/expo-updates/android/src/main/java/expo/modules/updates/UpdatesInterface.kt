package expo.modules.updates

import expo.modules.updates.db.DatabaseHolder
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.launcher.Launcher.LauncherCallback
import expo.modules.updates.loader.FileDownloader
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.statemachine.UpdatesStateMachine
import java.io.File

// this unused import must stay because of versioning
/* ktlint-disable no-unused-imports */
import expo.modules.updates.UpdatesConfiguration
/* ktlint-enable no-unused-imports */

/**
 * Interface implemented by the [UpdatesService] internal module and used by [UpdatesModule] to
 * search for the correct internal module in the registry.
 */
interface UpdatesInterface {
  val configuration: UpdatesConfiguration
  val selectionPolicy: SelectionPolicy
  val directory: File?
  val databaseHolder: DatabaseHolder
  val fileDownloader: FileDownloader
  val stateMachine: UpdatesStateMachine?

  val isEmergencyLaunch: Boolean
  val isEmbeddedLaunch: Boolean
  val isUsingEmbeddedAssets: Boolean
  fun canRelaunch(): Boolean
  val embeddedUpdate: UpdateEntity?
  val launchedUpdate: UpdateEntity?
  val localAssetFiles: Map<AssetEntity, String>?

  fun relaunchReactApplication(callback: LauncherCallback)
  fun resetSelectionPolicy()
}
