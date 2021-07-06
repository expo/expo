package expo.modules.updates.db.dao;

import androidx.room.Delete;
import androidx.room.Update;
import expo.modules.updates.db.enums.UpdateStatus;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Transaction;

@Dao
public abstract class UpdateDao {
  /**
   * for private use only
   * must be marked public for Room
   * so we use the underscore to discourage use
   */
  @Query("SELECT * FROM updates WHERE scope_key = :scopeKey AND status IN (:statuses);")
  public abstract List<UpdateEntity> _loadUpdatesForProjectWithStatuses(String scopeKey, List<UpdateStatus> statuses);

  @Query("SELECT * FROM updates WHERE id = :id;")
  public abstract List<UpdateEntity> _loadUpdatesWithId(UUID id);

  @Query("SELECT assets.* FROM assets INNER JOIN updates ON updates.launch_asset_id = assets.id WHERE updates.id = :id;")
  public abstract AssetEntity _loadLaunchAsset(UUID id);

  @Query("UPDATE updates SET keep = 1 WHERE id = :id;")
  public abstract void _keepUpdate(UUID id);

  @Query("UPDATE updates SET status = :status WHERE id = :id;")
  public abstract void _markUpdateWithStatus(UpdateStatus status, UUID id);

  @Update
  public abstract void _updateUpdate(UpdateEntity update);

  @Query("UPDATE updates SET status = :status WHERE id IN (" +
          "SELECT DISTINCT update_id FROM updates_assets WHERE asset_id IN (:missingAssetIds));")
  public abstract void _markUpdatesWithMissingAssets(List<Long> missingAssetIds, UpdateStatus status);


  /**
   * for public use
   */

  @Query("SELECT * FROM updates;")
  public abstract List<UpdateEntity> loadAllUpdates();

  public List<UpdateEntity> loadLaunchableUpdatesForScope(String scopeKey) {
    return _loadUpdatesForProjectWithStatuses(scopeKey, Arrays.asList(UpdateStatus.READY, UpdateStatus.EMBEDDED, UpdateStatus.DEVELOPMENT));
  }

  @Query("SELECT * FROM updates WHERE status = :status;")
  public abstract List<UpdateEntity> loadAllUpdatesWithStatus(UpdateStatus status);

  public UpdateEntity loadUpdateWithId(UUID id) {
    List<UpdateEntity> updateEntities = _loadUpdatesWithId(id);
    return updateEntities.size() > 0 ? updateEntities.get(0) : null;
  }

  public AssetEntity loadLaunchAsset(UUID id) {
    AssetEntity assetEntity = _loadLaunchAsset(id);
    assetEntity.isLaunchAsset = true;
    return assetEntity;
  }

  @Insert
  public abstract void insertUpdate(UpdateEntity update);

  public void setUpdateScopeKey(UpdateEntity update, String newScopeKey) {
    update.scopeKey = newScopeKey;
    _updateUpdate(update);
  }

  @Transaction
  public void markUpdateFinished(UpdateEntity update, boolean hasSkippedEmbeddedAssets) {
    UpdateStatus statusToMark = UpdateStatus.READY;
    if (update.status == UpdateStatus.DEVELOPMENT) {
      statusToMark = UpdateStatus.DEVELOPMENT;
    } else if (hasSkippedEmbeddedAssets) {
      statusToMark = UpdateStatus.EMBEDDED;
    }
    _markUpdateWithStatus(statusToMark, update.id);
    _keepUpdate(update.id);
  }

  public void markUpdateFinished(UpdateEntity update) {
    markUpdateFinished(update, false);
  }

  public void markUpdateAccessed(UpdateEntity update) {
    update.lastAccessed = new Date();
    _updateUpdate(update);
  }

  public void markUpdatesWithMissingAssets(List<AssetEntity> missingAssets) {
    List<Long> missingAssetIds = new ArrayList<>();
    for (AssetEntity asset : missingAssets) {
      missingAssetIds.add(asset.id);
    }
    _markUpdatesWithMissingAssets(missingAssetIds, UpdateStatus.PENDING);
  }

  @Delete
  public abstract void deleteUpdates(List<UpdateEntity> updates);
}
