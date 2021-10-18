package expo.modules.updates.db

import android.util.Log
import expo.modules.updates.UpdatesConfiguration
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.manifest.ManifestMetadata
import expo.modules.updates.selectionpolicy.SelectionPolicy
import java.io.File

object Reaper {
  private val TAG = Reaper::class.java.simpleName

  @JvmStatic fun reapUnusedUpdates(
    configuration: UpdatesConfiguration,
    database: UpdatesDatabase,
    updatesDirectory: File?,
    launchedUpdate: UpdateEntity?,
    selectionPolicy: SelectionPolicy
  ) {
    if (launchedUpdate == null) {
      Log.d(TAG, "Tried to reap while no update was launched; aborting")
      return
    }

    val allUpdates = database.updateDao().loadAllUpdates()

    val manifestFilters = ManifestMetadata.getManifestFilters(database, configuration)
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
      val path = File(updatesDirectory, asset.relativePath)
      try {
        if (path.exists() && !path.delete()) {
          Log.e(TAG, "Failed to delete asset with URL " + asset.url + " at path " + path.toString())
          erroredAssets.add(asset)
        }
      } catch (e: Exception) {
        Log.e(
          TAG,
          "Failed to delete asset with URL " + asset.url + " at path " + path.toString(),
          e
        )
        erroredAssets.add(asset)
      }
    }

    // retry failed deletions
    for (asset in erroredAssets) {
      val path = File(updatesDirectory, asset.relativePath)
      try {
        if (!path.exists() || path.delete()) {
          erroredAssets.remove(asset)
        } else {
          Log.e(
            TAG,
            "Retried and failed again deleting asset with URL " + asset.url + " at path " + path.toString()
          )
        }
      } catch (e: Exception) {
        Log.e(
          TAG,
          "Retried and failed again deleting asset with URL " + asset.url + " at path " + path.toString(),
          e
        )
        erroredAssets.add(asset)
      }
    }
  }
}
