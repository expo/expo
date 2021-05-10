package expo.modules.updates.db.entity;

import java.util.Date;

import androidx.annotation.NonNull;
import androidx.room.ColumnInfo;
import androidx.room.Entity;
import androidx.room.Index;
import androidx.room.PrimaryKey;

@Entity(tableName = "json_data",
        indices = {@Index(value = {"scope_key"})})
public class JSONDataEntity {
  @PrimaryKey(autoGenerate = true)
  // 0 is treated as unset while inserting the entity into the db
  public long id = 0;

  @NonNull
  public String key;

  @NonNull
  public String value;

  @ColumnInfo(name = "last_updated")
  @NonNull
  public Date lastUpdated;

  @ColumnInfo(name = "scope_key")
  @NonNull
  public String scopeKey;

  public JSONDataEntity(String key, String value, Date lastUpdated, String scopeKey) {
    this.key = key;
    this.value = value;
    this.lastUpdated = lastUpdated;
    this.scopeKey = scopeKey;
  }
}
