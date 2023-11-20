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
  /**
   * for private use only
   * must be marked public for Room
   * so we use the underscore to discourage use
   */

  // if an update has successfully launched at least once, we treat it as launchable
  // even if it has also failed to launch at least once
  @Query("SELECT * FROM updates WHERE scope_key = :scopeKey AND (successful_launch_count > 0 OR failed_launch_count < 1) AND status IN (:statuses);")
  abstract suspend fun _loadLaunchableUpdatesForProjectWithStatuses(scopeKey: String, statuses: List<UpdateStatus>): List<UpdateEntity>

  @Query("SELECT * FROM updates WHERE id = :id;")
  abstract suspend fun _loadUpdatesWithId(id: UUID): List<UpdateEntity>

  @Query("SELECT assets.* FROM assets INNER JOIN updates ON updates.launch_asset_id = assets.id WHERE updates.id = :id;")
  abstract suspend fun _loadLaunchAsset(id: UUID): AssetEntity

  @Query("UPDATE updates SET keep = 1 WHERE id = :id;")
  abstract suspend fun _keepUpdate(id: UUID)

  @Query("UPDATE updates SET status = :status WHERE id = :id;")
  abstract suspend fun _markUpdateWithStatus(status: UpdateStatus, id: UUID)

  @Query(
    "UPDATE updates SET status = :status WHERE id IN (" +
      "SELECT DISTINCT update_id FROM updates_assets WHERE asset_id IN (:missingAssetIds));"
  )
  abstract suspend fun _markUpdatesWithMissingAssets(missingAssetIds: List<Long>, status: UpdateStatus)

  /**
   * for public use
   */
  @Query("SELECT * FROM updates;")
  abstract suspend fun loadAllUpdates(): List<UpdateEntity>

  suspend fun loadLaunchableUpdatesForScope(scopeKey: String): List<UpdateEntity> {
    return _loadLaunchableUpdatesForProjectWithStatuses(
      scopeKey,
      listOf(UpdateStatus.READY, UpdateStatus.EMBEDDED, UpdateStatus.DEVELOPMENT)
    )
  }

  @Query("SELECT * FROM updates WHERE status = :status;")
  abstract suspend fun loadAllUpdatesWithStatus(status: UpdateStatus): List<UpdateEntity>

  @Query("SELECT id FROM updates WHERE status = :status;")
  abstract suspend fun loadAllUpdateIdsWithStatus(status: UpdateStatus): List<UUID>

  suspend fun loadUpdateWithId(id: UUID): UpdateEntity? {
    val updateEntities = _loadUpdatesWithId(id)
    return if (updateEntities.isNotEmpty()) updateEntities[0] else null
  }

  suspend fun loadLaunchAsset(id: UUID): AssetEntity {
    val assetEntity = _loadLaunchAsset(id)
    assetEntity.isLaunchAsset = true
    return assetEntity
  }

  @Insert
  abstract suspend fun insertUpdate(update: UpdateEntity)

  suspend fun setUpdateScopeKey(update: UpdateEntity, newScopeKey: String) {
    update.scopeKey = newScopeKey
    _setUpdateScopeKeyInternal(update.id, newScopeKey)
  }

  @Query("UPDATE updates SET scope_key = :newScopeKey WHERE id = :id;")
  abstract suspend fun _setUpdateScopeKeyInternal(id: UUID, newScopeKey: String)

  suspend fun setUpdateCommitTime(update: UpdateEntity, commitTime: Date) {
    update.commitTime = commitTime
    _setUpdateCommitTime(update.id, commitTime)
  }

  @Query("UPDATE updates SET commit_time = :commitTime WHERE id = :id;")
  abstract suspend fun _setUpdateCommitTime(id: UUID, commitTime: Date)

  @Transaction
  open suspend fun markUpdateFinished(update: UpdateEntity, hasSkippedEmbeddedAssets: Boolean) {
    var statusToMark = UpdateStatus.READY
    if (update.status === UpdateStatus.DEVELOPMENT) {
      statusToMark = UpdateStatus.DEVELOPMENT
    } else if (hasSkippedEmbeddedAssets) {
      statusToMark = UpdateStatus.EMBEDDED
    }
    _markUpdateWithStatus(statusToMark, update.id)
    _keepUpdate(update.id)
  }

  suspend fun markUpdateFinished(update: UpdateEntity) {
    markUpdateFinished(update, false)
  }

  suspend fun markUpdateAccessed(update: UpdateEntity) {
    val newLastAccessed = Date()
    update.lastAccessed = newLastAccessed
    _markUpdateAccessed(update.id, newLastAccessed)
  }

  @Query("UPDATE updates SET last_accessed = :lastAccessed WHERE id = :id;")
  abstract suspend fun _markUpdateAccessed(id: UUID, lastAccessed: Date)

  suspend fun incrementSuccessfulLaunchCount(update: UpdateEntity) {
    update.successfulLaunchCount++
    _incrementSuccessfulLaunchCount(update.id)
  }

  @Query("UPDATE updates SET successful_launch_count = successful_launch_count + 1 WHERE id = :id;")
  abstract suspend fun _incrementSuccessfulLaunchCount(id: UUID)

  suspend fun incrementFailedLaunchCount(update: UpdateEntity) {
    update.failedLaunchCount++
    _incrementFailedLaunchCount(update.id)
  }

  @Query("UPDATE updates SET failed_launch_count = failed_launch_count + 1 WHERE id = :id;")
  abstract suspend fun _incrementFailedLaunchCount(id: UUID)

  suspend fun markUpdatesWithMissingAssets(missingAssets: List<AssetEntity>) {
    val missingAssetIds = mutableListOf<Long>()
    for (asset in missingAssets) {
      missingAssetIds.add(asset.id)
    }
    _markUpdatesWithMissingAssets(missingAssetIds, UpdateStatus.PENDING)
  }

  @Delete
  abstract suspend fun deleteUpdates(updates: List<UpdateEntity>)
}
