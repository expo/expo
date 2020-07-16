package expo.modules.updates.db.entity;

import expo.modules.updates.db.enums.UpdateStatus;

import org.json.JSONObject;

import java.util.Date;
import java.util.UUID;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.ForeignKey;
import androidx.room.Index;
import androidx.room.PrimaryKey;

import static androidx.room.ForeignKey.CASCADE;

@Entity(tableName = "updates",
        foreignKeys = @ForeignKey(entity = AssetEntity.class,
                                  parentColumns = "id",
                                  childColumns = "launch_asset_id",
                                  onDelete = CASCADE),
        indices = {@Index(value = "launch_asset_id"),
                   @Index(value = {"scope_key", "commit_time"}, unique = true)})
public class UpdateEntity {
  @PrimaryKey
  @ColumnInfo(typeAffinity = ColumnInfo.BLOB)
  @NonNull
  public UUID id;

  @ColumnInfo(name = "scope_key")
  @NonNull
  public String scopeKey;

  @ColumnInfo(name = "commit_time")
  @NonNull
  public Date commitTime;

  @ColumnInfo(name = "runtime_version")
  @NonNull
  public String runtimeVersion;

  @ColumnInfo(name = "launch_asset_id")
  public Long launchAssetId = null;

  public JSONObject metadata = null;

  @NonNull
  public UpdateStatus status = UpdateStatus.PENDING;

  @NonNull
  public boolean keep = false;

  public UpdateEntity(UUID id, Date commitTime, String runtimeVersion, String scopeKey) {
    this.id = id;
    this.commitTime = commitTime;
    this.runtimeVersion = runtimeVersion;
    this.scopeKey = scopeKey;
  }
}
