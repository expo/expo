package expo.modules.updates.db.entity;

import android.net.Uri;

import androidx.room.Index;
import expo.modules.updates.db.enums.HashType;

import org.json.JSONObject;

import java.util.Date;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.Ignore;
import androidx.room.PrimaryKey;

@Entity(tableName = "assets",
        indices = {@Index(value = {"url"}, unique = true)})
public class AssetEntity {
  @PrimaryKey(autoGenerate = true)
  // 0 is treated as unset while inserting the entity into the db
  public long id = 0;

  @NonNull
  public Uri url;

  public JSONObject headers = null;

  @NonNull
  public String type;

  public JSONObject metadata = null;

  @ColumnInfo(name = "download_time")
  public Date downloadTime = null;

  @ColumnInfo(name = "relative_path")
  public String relativePath = null;

  public byte[] hash = null;

  @ColumnInfo(name = "hash_type")
  @NonNull
  public HashType hashType = HashType.SHA256;

  @ColumnInfo(name = "marked_for_deletion")
  @NonNull
  public boolean markedForDeletion = false;

  @Ignore
  public boolean isLaunchAsset = false;

  @Ignore
  public String embeddedAssetFilename = null;

  public AssetEntity(Uri url, String type) {
    this.url = url;
    this.type = type;
  }
}
