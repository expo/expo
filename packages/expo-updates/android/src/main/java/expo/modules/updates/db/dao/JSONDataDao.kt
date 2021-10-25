package expo.modules.updates.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import expo.modules.updates.db.entity.JSONDataEntity
import java.util.*

@Dao
abstract class JSONDataDao {
  /**
   * for private use only
   * must be marked public for Room
   * so we use the underscore to discourage use
   */
  @Query("SELECT * FROM json_data WHERE `key` = :key AND scope_key = :scopeKey ORDER BY last_updated DESC LIMIT 1;")
  abstract fun _loadJSONDataForKey(key: String, scopeKey: String): List<JSONDataEntity>

  @Insert
  abstract fun _insertJSONData(jsonDataEntity: JSONDataEntity)

  @Query("DELETE FROM json_data WHERE `key` = :key AND scope_key = :scopeKey;")
  abstract fun _deleteJSONDataForKey(key: String, scopeKey: String)

  /**
   * for public use
   */
  fun loadJSONStringForKey(key: String, scopeKey: String): String? {
    val rows = _loadJSONDataForKey(key, scopeKey)
    return if (rows.isEmpty()) {
      null
    } else rows[0].value
  }

  @Transaction
  open fun setJSONStringForKey(key: String, value: String, scopeKey: String) {
    _deleteJSONDataForKey(key, scopeKey)
    _insertJSONData(JSONDataEntity(key, value, Date(), scopeKey))
  }

  @Transaction
  open fun setMultipleFields(fields: Map<String, String>, scopeKey: String) {
    val iterator = fields.entries.iterator()
    while (iterator.hasNext()) {
      val entry = iterator.next()
      _deleteJSONDataForKey(entry.key, scopeKey)
      _insertJSONData(JSONDataEntity(entry.key, entry.value, Date(), scopeKey))
    }
  }
}
