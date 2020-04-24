package expo.modules.updates.db.dao;

import androidx.room.Delete;
import expo.modules.updates.db.enums.UpdateStatus;
import expo.modules.updates.db.entity.AssetEntity;
import expo.modules.updates.db.entity.UpdateEntity;

import java.util.Arrays;
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
  @Query("SELECT * FROM updates WHERE status IN (:statuses);")
  public abstract List<UpdateEntity> _loadUpdatesWithStatuses(List<UpdateStatus> statuses);

  @Query("SELECT * FROM updates WHERE id = :id;")
  public abstract List<UpdateEntity> _loadUpdatesWithId(UUID id);

  @Query("SELECT assets.* FROM assets INNER JOIN updates ON updates.launch_asset_id = assets.id WHERE updates.id = :id;")
  public abstract AssetEntity _loadLaunchAsset(UUID id);

  @Query("UPDATE updates SET keep = 1 WHERE id = :id;")
  public abstract void _keepUpdate(UUID id);

  @Query("UPDATE updates SET status = :status WHERE id = :id;")
  public abstract void _markUpdateWithStatus(UpdateStatus status, UUID id);


  /**
   * for public use
   */
  @Query("SELECT * FROM updates;")
  public abstract List<UpdateEntity> loadAllUpdates();

  public List<UpdateEntity> loadLaunchableUpdates() {
    return _loadUpdatesWithStatuses(Arrays.asList(UpdateStatus.READY, UpdateStatus.EMBEDDED));
  }

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

  @Transaction
  public void markUpdateFinished(UpdateEntity update, boolean hasSkippedEmbeddedAssets) {
    _markUpdateWithStatus(hasSkippedEmbeddedAssets ? UpdateStatus.EMBEDDED : UpdateStatus.READY, update.id);
    _keepUpdate(update.id);
  }

  public void markUpdateFinished(UpdateEntity update) {
    markUpdateFinished(update, false);
  }

  @Delete
  public abstract void deleteUpdates(List<UpdateEntity> updates);
}
