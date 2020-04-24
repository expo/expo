package expo.modules.updates.db.dao;

import androidx.annotation.Nullable;
import androidx.room.Update;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateAssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import java.util.List;
import java.util.UUID;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Transaction;

@Dao
public abstract class AssetDao {
  /**
   * for private use only
   * must be marked public for Room
   * so we use the underscore to discourage use
   */
  @Insert(onConflict = OnConflictStrategy.REPLACE)
  public abstract long _insertAsset(AssetEntity asset);

  @Insert(onConflict = OnConflictStrategy.REPLACE)
  public abstract void _insertUpdateAsset(UpdateAssetEntity updateAsset);

  @Query("UPDATE updates SET launch_asset_id = :assetId WHERE id = :updateId;")
  public abstract void _setUpdateLaunchAsset(long assetId, UUID updateId);

  @Query("UPDATE assets SET marked_for_deletion = 1;")
  public abstract void _markAllAssetsForDeletion();

  @Query("UPDATE assets SET marked_for_deletion = 0 WHERE id IN (" +
          " SELECT asset_id" +
          " FROM updates_assets" +
          " INNER JOIN updates ON updates_assets.update_id = updates.id" +
          " WHERE updates.keep);")
  public abstract void _unmarkUsedAssetsFromDeletion();

  @Query("SELECT * FROM assets WHERE marked_for_deletion = 1;")
  public abstract List<AssetEntity> _loadAssetsMarkedForDeletion();

  @Query("DELETE FROM assets WHERE marked_for_deletion = 1;")
  public abstract void _deleteAssetsMarkedForDeletion();

  @Query("SELECT * FROM assets WHERE packager_key = :packagerKey LIMIT 1;")
  public abstract List<AssetEntity> _loadAssetWithPackagerKey(String packagerKey);


  /**
   * for public use
   */
  @Query("SELECT assets.id, url, packager_key, headers, type, assets.metadata, download_time, relative_path, hash, hash_type, marked_for_deletion" +
          " FROM assets" +
          " INNER JOIN updates_assets ON updates_assets.asset_id = assets.id" +
          " INNER JOIN updates ON updates_assets.update_id = updates.id" +
          " WHERE updates.id = :id;")
  public abstract List<AssetEntity> loadAssetsForUpdate(UUID id);

  @Update
  public abstract void updateAsset(AssetEntity assetEntity);

  @Transaction
  public void insertAssets(List<AssetEntity> assets, UpdateEntity update) {
    for (AssetEntity asset : assets) {
      long assetId = _insertAsset(asset);
      _insertUpdateAsset(new UpdateAssetEntity(update.id, assetId));
      if (asset.isLaunchAsset) {
        _setUpdateLaunchAsset(assetId, update.id);
      }
    }
  }

  public @Nullable AssetEntity loadAssetWithPackagerKey(String packagerKey) {
    List<AssetEntity> assets = _loadAssetWithPackagerKey(packagerKey);
    if (assets.size() > 0) {
      return assets.get(0);
    }
    return null;
  }

  public void mergeAndUpdateAsset(AssetEntity existingEntity, AssetEntity newEntity) {
    // if the existing entry came from an embedded manifest, it may not have a URL in the database
    if (newEntity.url != null && existingEntity.url == null) {
      existingEntity.url = newEntity.url;
      updateAsset(existingEntity);
    }
  }

  @Transaction
  public boolean addExistingAssetToUpdate(UpdateEntity update, AssetEntity asset, boolean isLaunchAsset) {
    AssetEntity existingAssetEntry = loadAssetWithPackagerKey(asset.packagerKey);
    if (existingAssetEntry == null) {
      return false;
    }
    long assetId = existingAssetEntry.id;
    _insertUpdateAsset(new UpdateAssetEntity(update.id, assetId));
    if (isLaunchAsset) {
      _setUpdateLaunchAsset(assetId, update.id);
    }
    return true;
  }

  @Transaction
  public List<AssetEntity> deleteUnusedAssets() {
    // the simplest way to mark the assets we want to delete
    // is to mark all assets for deletion, then go back and unmark
    // those assets in updates we want to keep
    // this is safe since this is a transaction and will be rolled back upon failure
    _markAllAssetsForDeletion();
    _unmarkUsedAssetsFromDeletion();

    List<AssetEntity> deletedAssets = _loadAssetsMarkedForDeletion();
    _deleteAssetsMarkedForDeletion();

    return deletedAssets;
  }
}
