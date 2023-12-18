package expo.modules.updates.db.dao

import androidx.room.*
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateAssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import java.util.*

/**
 * Utility class for accessing and modifying data in SQLite relating to assets.
 */
@Dao
abstract class AssetDao {
  /**
   * for private use only
   * must be marked public for Room
   * so we use the underscore to discourage use
   */
  @Insert(onConflict = OnConflictStrategy.REPLACE)
  abstract fun _insertAsset(asset: AssetEntity): Long

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  abstract fun _insertUpdateAsset(updateAsset: UpdateAssetEntity)

  @Query("UPDATE updates SET launch_asset_id = :assetId WHERE id = :updateId;")
  abstract fun _setUpdateLaunchAsset(assetId: Long, updateId: UUID)

  @Query("UPDATE assets SET marked_for_deletion = 1;")
  abstract fun _markAllAssetsForDeletion()

  @Query(
    "UPDATE assets SET marked_for_deletion = 0 WHERE id IN (" +
      " SELECT asset_id" +
      " FROM updates_assets" +
      " INNER JOIN updates ON updates_assets.update_id = updates.id" +
      " WHERE updates.keep);"
  )
  abstract fun _unmarkUsedAssetsFromDeletion()

  @Query(
    "UPDATE assets SET marked_for_deletion = 0 WHERE relative_path IN (" +
      " SELECT relative_path" +
      " FROM assets" +
      " WHERE marked_for_deletion = 0);"
  )
  abstract fun _unmarkDuplicateUsedAssetsFromDeletion()

  @Query("SELECT * FROM assets WHERE marked_for_deletion = 1;")
  abstract fun _loadAssetsMarkedForDeletion(): List<AssetEntity>

  @Query("DELETE FROM assets WHERE marked_for_deletion = 1;")
  abstract fun _deleteAssetsMarkedForDeletion()

  @Query("SELECT * FROM assets WHERE `key` = :key LIMIT 1;")
  abstract fun _loadAssetWithKey(key: String?): List<AssetEntity>

  /**
   * for public use
   */
  @Query("SELECT * FROM assets;")
  abstract fun loadAllAssets(): List<AssetEntity>

  @Query(
    "SELECT assets.*" +
      " FROM assets" +
      " INNER JOIN updates_assets ON updates_assets.asset_id = assets.id" +
      " INNER JOIN updates ON updates_assets.update_id = updates.id" +
      " WHERE updates.id = :id;"
  )
  abstract fun loadAssetsForUpdate(id: UUID): List<AssetEntity>

  @Update
  abstract fun updateAsset(assetEntity: AssetEntity)

  @Transaction
  open fun insertAssets(assets: List<AssetEntity>, update: UpdateEntity) {
    for (asset in assets) {
      val assetId = _insertAsset(asset)
      _insertUpdateAsset(UpdateAssetEntity(update.id, assetId))
      if (asset.isLaunchAsset) {
        _setUpdateLaunchAsset(assetId, update.id)
      }
    }
  }

  fun loadAssetWithKey(key: String?): AssetEntity? {
    val assets = _loadAssetWithKey(key)
    return if (assets.isNotEmpty()) {
      assets[0]
    } else {
      null
    }
  }

  fun mergeAndUpdateAsset(existingEntity: AssetEntity, newEntity: AssetEntity) {
    // if the existing entry came from an embedded manifest, it may not have a URL in the database
    var shouldUpdate = false
    if (newEntity.url != null && (existingEntity.url == null || newEntity.url != existingEntity.url)) {
      existingEntity.url = newEntity.url
      shouldUpdate = true
    }

    val newEntityExtraRequestHeaders = newEntity.extraRequestHeaders
    if (newEntityExtraRequestHeaders != null &&
      (existingEntity.extraRequestHeaders == null || newEntityExtraRequestHeaders != existingEntity.extraRequestHeaders)
    ) {
      existingEntity.extraRequestHeaders = newEntity.extraRequestHeaders
      shouldUpdate = true
    }

    if (shouldUpdate) {
      updateAsset(existingEntity)
    }

    // we need to keep track of whether the calling class expects this asset to be the launch asset
    existingEntity.isLaunchAsset = newEntity.isLaunchAsset
    // some fields on the asset entity are not stored in the database but might still be used by application code
    existingEntity.embeddedAssetFilename = newEntity.embeddedAssetFilename
    existingEntity.resourcesFilename = newEntity.resourcesFilename
    existingEntity.resourcesFolder = newEntity.resourcesFolder
    existingEntity.scale = newEntity.scale
    existingEntity.scales = newEntity.scales
  }

  @Transaction
  open fun addExistingAssetToUpdate(
    update: UpdateEntity,
    asset: AssetEntity,
    isLaunchAsset: Boolean
  ): Boolean {
    val existingAssetEntry = loadAssetWithKey(asset.key) ?: return false
    val assetId = existingAssetEntry.id
    _insertUpdateAsset(UpdateAssetEntity(update.id, assetId))
    if (isLaunchAsset) {
      _setUpdateLaunchAsset(assetId, update.id)
    }
    return true
  }

  @Transaction
  open fun deleteUnusedAssets(): List<AssetEntity> {
    // the simplest way to mark the assets we want to delete
    // is to mark all assets for deletion, then go back and unmark
    // those assets in updates we want to keep
    // this is safe since this is a transaction and will be rolled back upon failure
    _markAllAssetsForDeletion()
    _unmarkUsedAssetsFromDeletion()
    // check for duplicate rows representing a single file on disk
    _unmarkDuplicateUsedAssetsFromDeletion()
    val deletedAssets = _loadAssetsMarkedForDeletion()
    _deleteAssetsMarkedForDeletion()
    return deletedAssets
  }
}
