package expo.modules.updates.db.dao

import androidx.room.*
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.db.enums.UpdateStatus
import java.util.*

/**
 * Utility class for accessing and modifying data in SQLite relating to updates.
 */
@Dao
abstract class UpdateDao {
  // if an update has successfully launched at least once, we treat it as launchable
  // even if it has also failed to launch at least once
  @Query("SELECT * FROM updates WHERE scope_key = :scopeKey AND (successful_launch_count > 0 OR failed_launch_count < 1) AND status IN (:statuses);")
  protected abstract fun loadLaunchableUpdatesForProjectWithStatuses(scopeKey: String, statuses: List<UpdateStatus>): List<UpdateEntity>

  @Query("SELECT * FROM updates WHERE id = :id;")
  protected abstract fun loadUpdatesWithId(id: UUID): List<UpdateEntity>

  @Query("SELECT assets.* FROM assets INNER JOIN updates ON updates.launch_asset_id = assets.id WHERE updates.id = :updateId;")
  protected abstract fun loadLaunchAssetForUpdateInternal(updateId: UUID): AssetEntity?

  @Query("UPDATE updates SET keep = 1 WHERE id = :id;")
  protected abstract fun keepUpdate(id: UUID)

  @Query("UPDATE updates SET status = :status WHERE id = :id;")
  protected abstract fun markUpdateWithStatus(status: UpdateStatus, id: UUID)

  @Query(
    "UPDATE updates SET status = :status WHERE id IN (" +
      "SELECT DISTINCT update_id FROM updates_assets WHERE asset_id IN (:missingAssetIds));"
  )
  protected abstract fun markUpdatesWithMissingAssets(missingAssetIds: List<Long>, status: UpdateStatus)

  /**
   * for public use
   */
  @Query("SELECT * FROM updates;")
  abstract fun loadAllUpdates(): List<UpdateEntity>

  fun loadLaunchableUpdatesForScope(scopeKey: String): List<UpdateEntity> {
    return loadLaunchableUpdatesForProjectWithStatuses(
      scopeKey,
      listOf(UpdateStatus.READY, UpdateStatus.EMBEDDED, UpdateStatus.DEVELOPMENT)
    )
  }

  @Query("SELECT * FROM updates WHERE status = :status;")
  abstract fun loadAllUpdatesWithStatus(status: UpdateStatus): List<UpdateEntity>

  @Query("SELECT id FROM updates WHERE status = :status;")
  abstract fun loadAllUpdateIdsWithStatus(status: UpdateStatus): List<UUID>

  @Query("SELECT id FROM updates WHERE failed_launch_count > 0 ORDER BY commit_time DESC LIMIT 5;")
  abstract fun loadRecentUpdateIdsWithFailedLaunch(): List<UUID>

  fun loadUpdateWithId(id: UUID): UpdateEntity? {
    val updateEntities = loadUpdatesWithId(id)
    return if (updateEntities.isNotEmpty()) updateEntities[0] else null
  }

  fun loadLaunchAssetForUpdate(updateId: UUID): AssetEntity? {
    return loadLaunchAssetForUpdateInternal(updateId)?.apply {
      isLaunchAsset = true
    }
  }

  @Insert
  abstract fun insertUpdate(update: UpdateEntity)

  fun setUpdateScopeKey(update: UpdateEntity, newScopeKey: String) {
    update.scopeKey = newScopeKey
    _setUpdateScopeKeyInternal(update.id, newScopeKey)
  }

  @Query("UPDATE updates SET scope_key = :newScopeKey WHERE id = :id;")
  abstract fun _setUpdateScopeKeyInternal(id: UUID, newScopeKey: String)

  fun setUpdateCommitTime(update: UpdateEntity, commitTime: Date) {
    update.commitTime = commitTime
    setUpdateCommitTimeInternal(update.id, commitTime)
  }

  @Query("UPDATE updates SET commit_time = :commitTime WHERE id = :id;")
  abstract fun setUpdateCommitTimeInternal(id: UUID, commitTime: Date)

  @Transaction
  open fun markUpdateFinished(update: UpdateEntity, hasSkippedEmbeddedAssets: Boolean) {
    var statusToMark = UpdateStatus.READY
    if (update.status === UpdateStatus.DEVELOPMENT) {
      statusToMark = UpdateStatus.DEVELOPMENT
    } else if (hasSkippedEmbeddedAssets) {
      statusToMark = UpdateStatus.EMBEDDED
    }
    markUpdateWithStatus(statusToMark, update.id)
    keepUpdate(update.id)
  }

  fun markUpdateFinished(update: UpdateEntity) {
    markUpdateFinished(update, false)
  }

  fun markUpdateAccessed(update: UpdateEntity) {
    val newLastAccessed = Date()
    update.lastAccessed = newLastAccessed
    markUpdateAccessedInternal(update.id, newLastAccessed)
  }

  @Query("UPDATE updates SET last_accessed = :lastAccessed WHERE id = :id;")
  protected abstract fun markUpdateAccessedInternal(id: UUID, lastAccessed: Date)

  fun incrementSuccessfulLaunchCount(update: UpdateEntity) {
    update.successfulLaunchCount++
    incrementSuccessfulLaunchCountInternal(update.id)
  }

  @Query("UPDATE updates SET successful_launch_count = successful_launch_count + 1 WHERE id = :id;")
  protected abstract fun incrementSuccessfulLaunchCountInternal(id: UUID)

  fun incrementFailedLaunchCount(update: UpdateEntity) {
    update.failedLaunchCount++
    incrementFailedLaunchCountInternal(update.id)
  }

  @Query("UPDATE updates SET failed_launch_count = failed_launch_count + 1 WHERE id = :id;")
  abstract fun incrementFailedLaunchCountInternal(id: UUID)

  fun markUpdatesWithMissingAssets(missingAssets: List<AssetEntity>) {
    val missingAssetIds = mutableListOf<Long>()
    for (asset in missingAssets) {
      missingAssetIds.add(asset.id)
    }
    markUpdatesWithMissingAssets(missingAssetIds, UpdateStatus.PENDING)
  }

  @Delete
  abstract fun deleteUpdates(updates: List<UpdateEntity>)
}
