package expo.modules.updates.db

import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.UpdatesUtils
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.logging.UpdatesLogger
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.selectionpolicy.SelectionPolicy
import expo.modules.updates.utils.AndroidResourceAssetUtils
import expo.modules.updatesinterface.UpdatesLogMessage
import java.io.File

/**
 * Safely clears old, unused assets and updates from the filesystem and database.
 *
 * Should be run in a background process when no other updates-related events are occurring (e.g.
 * update download).
 */
object Reaper {
  private val TAG = Reaper::class.java.simpleName

  @JvmStatic fun reapUnusedUpdates(
    configuration: UpdatesConfiguration,
    database: UpdatesDatabase,
    updatesDirectory: File?,
    launchedUpdate: UpdateEntity?,
    selectionPolicy: SelectionPolicy,
    logger: UpdatesLogger
  ) {
    if (launchedUpdate == null) {
      Log.d(TAG, "Tried to reap while no update was launched; aborting")
      return
    }

    val allUpdates = database.updateDao().loadAllUpdates()

    val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration, logger)
    val updatesToDelete = selectionPolicy.selectUpdatesToDelete(allUpdates, launchedUpdate, manifestFilters)
    database.updateDao().deleteUpdates(updatesToDelete)

    val assetsToDelete = database.assetDao().deleteUnusedAssets()

    val erroredAssets = mutableListOf<AssetEntity>()

    for (asset in assetsToDelete) {
      if (!asset.markedForDeletion) {
        Log.e(
          TAG,
          "Tried to delete asset with URL " + asset.url + " but it was not marked for deletion"
        )
        continue
      }
      val relativePath = asset.relativePath
      // Embedded assets are served from the APK, so there is no file here to delete.
      if (relativePath == null || AndroidResourceAssetUtils.isAndroidResourceAsset(relativePath)) {
        continue
      }
      // A row written before asset filenames were validated may point outside the updates directory.
      if (!UpdatesUtils.isSafeFilename(relativePath)) {
        logger.warn(UpdatesLogMessage.ReaperUnsafePath, values = mapOf("filename" to relativePath))
        continue
      }
      val path = File(updatesDirectory, relativePath)
      try {
        if (path.exists() && !path.delete()) {
          logger.warn(UpdatesLogMessage.ReaperAssetDeleteFailed, values = deleteValues(path, retry = false) + DELETE_RETURNED_FALSE)
          erroredAssets.add(asset)
        }
      } catch (e: Exception) {
        logger.warn(UpdatesLogMessage.ReaperAssetDeleteFailed, e, deleteValues(path, retry = false))
        erroredAssets.add(asset)
      }
    }

    // retry failed deletions
    for (asset in erroredAssets) {
      val path = File(updatesDirectory, asset.relativePath)
      try {
        if (path.exists() && !path.delete()) {
          logger.warn(UpdatesLogMessage.ReaperAssetDeleteFailed, values = deleteValues(path, retry = true) + DELETE_RETURNED_FALSE)
        }
      } catch (e: Exception) {
        logger.warn(UpdatesLogMessage.ReaperAssetDeleteFailed, e, deleteValues(path, retry = true))
      }
    }
  }

  private fun deleteValues(path: File, retry: Boolean): Map<String, String> =
    mapOf("path" to path.toString(), "retry" to retry.toString())

  // A failed File.delete() returns false and throws nothing, so this value is its cause.
  private val DELETE_RETURNED_FALSE = "cause" to "File.delete() returned false"
}
