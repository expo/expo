package expo.modules.updates.db.entity;

import java.util.UUID;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;

import static androidx.room.ForeignKey.CASCADE;

@Entity(tableName = "updates_assets",
        primaryKeys = {"update_id", "asset_id"},
        foreignKeys = {
          @ForeignKey(entity = UpdateEntity.class,
                      parentColumns = "id",
                      childColumns = "update_id",
                      onDelete = CASCADE),
          @ForeignKey(entity = AssetEntity.class,
                      parentColumns = "id",
                      childColumns = "asset_id",
                      onDelete = CASCADE)},
        indices = {@Index(value = "asset_id")})
public class UpdateAssetEntity {
  @ColumnInfo(name = "update_id")
  @NonNull
  public UUID updateId;

  @ColumnInfo(name = "asset_id")
  @NonNull
  public long assetId;

  public UpdateAssetEntity(UUID updateId, long assetId) {
    this.updateId = updateId;
    this.assetId = assetId;
  }
}
