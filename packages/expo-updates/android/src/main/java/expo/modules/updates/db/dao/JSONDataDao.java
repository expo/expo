package expo.modules.updates.db.dao;

import java.util.Date;
import java.util.List;

import javax.annotation.Nullable;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import androidx.room.Transaction;
import expo.modules.updates.db.entity.JSONDataEntity;

@Dao
public abstract class JSONDataDao {
  /**
   * for private use only
   * must be marked public for Room
   * so we use the underscore to discourage use
   */
  @Query("SELECT * FROM json_data WHERE `key` = :key AND scope_key = :scopeKey ORDER BY last_updated DESC LIMIT 1;")
  public abstract List<JSONDataEntity> _loadJSONDataForKey(String key, String scopeKey);

  @Insert
  public abstract void _insertJSONData(JSONDataEntity jsonDataEntity);

  @Query("DELETE FROM json_data WHERE `key` = :key AND scope_key = :scopeKey;")
  public abstract void _deleteJSONDataForKey(String key, String scopeKey);

  /**
   * for public use
   */
  public @Nullable String loadJSONStringForKey(String key, String scopeKey) {
    List<JSONDataEntity> rows = _loadJSONDataForKey(key, scopeKey);
    if (rows == null || rows.size() == 0) {
      return null;
    }
    return rows.get(0).value;
  }

  @Transaction
  public void setJSONStringForKey(String key, String value, String scopeKey) {
    _deleteJSONDataForKey(key, scopeKey);
    _insertJSONData(new JSONDataEntity(key, value, new Date(), scopeKey));
  }
}
