package expo.modules.updates.db.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.Query
import androidx.room.Transaction
import expo.modules.updates.db.entity.JSONDataEntity
import java.util.*

/**
 * Utility class for accessing and modifying data in the `json_data` SQLite table.
 */
@Dao
abstract class JSONDataDao {
  @Query("SELECT * FROM json_data WHERE `key` = :key AND scope_key = :scopeKey ORDER BY last_updated DESC LIMIT 1;")
  protected abstract fun loadJSONDataForKeyInternal(key: String, scopeKey: String): List<JSONDataEntity>

  @Insert
  protected abstract fun insertJSONDataInternal(jsonDataEntity: JSONDataEntity)

  @Query("DELETE FROM json_data WHERE `key` = :key AND scope_key = :scopeKey;")
  protected abstract fun deleteJSONDataForKeyInternal(key: String, scopeKey: String)

  /**
   * for public use
   */
  fun loadJSONStringForKey(key: String, scopeKey: String): String? {
    val rows = loadJSONDataForKeyInternal(key, scopeKey)
    return if (rows.isEmpty()) {
      null
    } else {
      rows[0].value
    }
  }

  @Transaction
  open fun setJSONStringForKey(key: String, value: String, scopeKey: String) {
    deleteJSONDataForKeyInternal(key, scopeKey)
    insertJSONDataInternal(JSONDataEntity(key, value, Date(), scopeKey))
  }

  @Transaction
  open fun setMultipleFields(fields: Map<String, String>, scopeKey: String) {
    val iterator = fields.entries.iterator()
    while (iterator.hasNext()) {
      val entry = iterator.next()
      deleteJSONDataForKeyInternal(entry.key, scopeKey)
      insertJSONDataInternal(JSONDataEntity(entry.key, entry.value, Date(), scopeKey))
    }
  }

  @Transaction
  open fun updateJSONStringForKey(key: String, scopeKey: String, updater: (previousValue: String?) -> String) {
    val previousValue = loadJSONStringForKey(key, scopeKey)
    deleteJSONDataForKeyInternal(key, scopeKey)
    insertJSONDataInternal(JSONDataEntity(key, updater(previousValue), Date(), scopeKey))
  }
}
