package expo.modules.updates.db

import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import java.io.File

open class DatabaseIntegrityCheck {
  fun run(database: UpdatesDatabase, updatesDirectory: File?, embeddedUpdate: UpdateEntity?) {
    val assets = database.assetDao().loadAllAssets()

    val missingAssets = mutableListOf<AssetEntity>()
    for (asset in assets) {
      if (asset.relativePath == null || !assetExists(asset, updatesDirectory)) {
        missingAssets.add(asset)
      }
    }

    if (missingAssets.size > 0) {
      database.updateDao().markUpdatesWithMissingAssets(missingAssets)
    }

    val updatesToDelete = mutableListOf<UpdateEntity>()
    // we can't run any updates with the status EMBEDDED unless they match the current embedded update
    val updatesWithEmbeddedStatus = database.updateDao().loadAllUpdatesWithStatus(UpdateStatus.EMBEDDED)
    for (update in updatesWithEmbeddedStatus) {
      if (embeddedUpdate == null || update.id != embeddedUpdate.id) {
        updatesToDelete.add(update)
      }
    }

    if (updatesToDelete.size > 0) {
      database.updateDao().deleteUpdates(updatesToDelete)
    }
  }

  internal fun assetExists(asset: AssetEntity, updatesDirectory: File?): Boolean {
    val path = File(updatesDirectory, asset.relativePath)
    return path.exists()
  }
}
