package expo.modules.updates.db.dao

import androidx.annotation.VisibleForTesting
import androidx.room.*
import expo.modules.updates.db.entity.AssetEntity
import expo.modules.updates.db.entity.UpdateAssetEntity
import expo.modules.updates.db.entity.UpdateEntity
import expo.modules.updates.utils.AndroidResourceAssetUtils
import java.util.*

/**
 * Utility class for accessing and modifying data in SQLite relating to assets.
 */
@Dao
abstract class AssetDao {
  @Insert(onConflict = OnConflictStrategy.REPLACE)
  protected abstract fun insertAssetInternal(asset: AssetEntity): Long

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  protected abstract fun insertUpdateAssetInternal(updateAsset: UpdateAssetEntity)

  @Query("UPDATE updates SET launch_asset_id = :assetId WHERE id = :updateId;")
  protected abstract fun setUpdateLaunchAssetInternal(assetId: Long, updateId: UUID)

  @Query("UPDATE assets SET marked_for_deletion = 1;")
  protected abstract fun markAllAssetsForDeletionInternal()

  @Query(
    "UPDATE assets SET marked_for_deletion = 0 WHERE id IN (" +
      " SELECT asset_id" +
      " FROM updates_assets" +
      " INNER JOIN updates ON updates_assets.update_id = updates.id" +
      " WHERE updates.keep);"
  )
  protected abstract fun unMarkUsedAssetsFromDeletionInternal()

  @Query(
    "UPDATE assets SET marked_for_deletion = 0 WHERE id IN (" +
      " SELECT launch_asset_id" +
      " FROM updates" +
      " WHERE updates.keep);"
  )
  protected abstract fun unMarkUsedLaunchAssetsFromDeletionInternal()

  @Query(
    "UPDATE assets SET marked_for_deletion = 0 WHERE relative_path IN (" +
      " SELECT relative_path" +
      " FROM assets" +
      " WHERE marked_for_deletion = 0);"
  )
  protected abstract fun unMarkDuplicateUsedAssetsFromDeletionInternal()

  @Query("SELECT * FROM assets WHERE marked_for_deletion = 1;")
  protected abstract fun loadAssetsMarkedForDeletionInternal(): List<AssetEntity>

  @Query("DELETE FROM assets WHERE marked_for_deletion = 1;")
  protected abstract fun deleteAssetsMarkedForDeletionInternal()

  @Query("SELECT * FROM assets WHERE `key` = :key LIMIT 1;")
  protected abstract fun loadAssetWithKeyInternal(key: String?): List<AssetEntity>

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
      val assetId = insertAssetInternal(asset)
      insertUpdateAssetInternal(UpdateAssetEntity(update.id, assetId))
      if (asset.isLaunchAsset) {
        setUpdateLaunchAssetInternal(assetId, update.id)
      }
    }
  }

  fun loadAssetWithKey(key: String?): AssetEntity? {
    val asset = loadAssetWithKeyInternal(key).firstOrNull() ?: return null

    // Load some properties not stored in database but can be computed from other fields
    asset.relativePath?.let {
      val (embeddedAssetFilename, resourceFolder, resourceFilename) =
        AndroidResourceAssetUtils.parseAndroidResponseAssetFromPath(it)
      asset.embeddedAssetFilename = embeddedAssetFilename
      asset.resourcesFolder = resourceFolder
      asset.resourcesFilename = resourceFilename
    }
    return asset
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
    newEntity.embeddedAssetFilename?.let { existingEntity.embeddedAssetFilename = it }
    newEntity.resourcesFilename?.let { existingEntity.resourcesFilename = it }
    newEntity.resourcesFolder?.let { existingEntity.resourcesFolder = it }
    newEntity.scale?.let { existingEntity.scale = it }
    newEntity.scales?.let { existingEntity.scales = it }
  }

  @Transaction
  open fun addExistingAssetToUpdate(
    update: UpdateEntity,
    asset: AssetEntity,
    isLaunchAsset: Boolean
  ): Boolean {
    val existingAssetEntry = loadAssetWithKey(asset.key) ?: return false
    val assetId = existingAssetEntry.id
    insertUpdateAssetInternal(UpdateAssetEntity(update.id, assetId))
    if (isLaunchAsset) {
      setUpdateLaunchAssetInternal(assetId, update.id)
    }
    return true
  }

  @Transaction
  open fun deleteUnusedAssets(): List<AssetEntity> {
    // the simplest way to mark the assets we want to delete
    // is to mark all assets for deletion, then go back and un-mark
    // those assets in updates we want to keep
    // this is safe since this is a transaction and will be rolled back upon failure
    markAllAssetsForDeletionInternal()
    unMarkUsedAssetsFromDeletionInternal()
    unMarkUsedLaunchAssetsFromDeletionInternal()
    // check for duplicate rows representing a single file on disk
    unMarkDuplicateUsedAssetsFromDeletionInternal()
    val deletedAssets = loadAssetsMarkedForDeletionInternal()
    deleteAssetsMarkedForDeletionInternal()
    return deletedAssets
  }

  @VisibleForTesting(otherwise = VisibleForTesting.NONE)
  internal fun insertAssetForTest(asset: AssetEntity): Long {
    return insertAssetInternal(asset)
  }

  @VisibleForTesting(otherwise = VisibleForTesting.NONE)
  internal fun insertUpdateAssetForTest(updateAsset: UpdateAssetEntity) {
    insertUpdateAssetInternal(updateAsset)
  }
}
