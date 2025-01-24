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
  enum class JSONDataKey(val key: String) {
    STATIC_BUILD_DATA("staticBuildData"),
    EXTRA_PARAMS("extraParams"),
    MANIFEST_SERVER_DEFINED_HEADERS("serverDefinedHeaders"),
    MANIFEST_FILTERS("manifestFilters")
  }

  @Query("SELECT * FROM json_data WHERE `key` = :key AND scope_key = :scopeKey ORDER BY last_updated DESC LIMIT 1;")
  protected abstract fun loadJSONDataForKeyInternal(key: String, scopeKey: String): List<JSONDataEntity>

  @Insert
  protected abstract fun insertJSONDataInternal(jsonDataEntity: JSONDataEntity)

  @Query("DELETE FROM json_data WHERE `key` = :key AND scope_key = :scopeKey;")
  protected abstract fun deleteJSONDataForKeyInternal(key: String, scopeKey: String)

  @Query("DELETE FROM json_data WHERE `key` IN (:keys)")
  protected abstract fun deleteJSONDataForKeysForAllScopeKeysInternal(keys: List<String>)

  /**
   * for public use
   */
  fun loadJSONStringForKey(key: JSONDataKey, scopeKey: String): String? {
    val rows = loadJSONDataForKeyInternal(key.key, scopeKey)
    return if (rows.isEmpty()) {
      null
    } else {
      rows[0].value
    }
  }

  @Transaction
  open fun setJSONStringForKey(key: JSONDataKey, value: String, scopeKey: String) {
    deleteJSONDataForKeyInternal(key.key, scopeKey)
    insertJSONDataInternal(JSONDataEntity(key.key, value, Date(), scopeKey))
  }

  @Transaction
  open fun setMultipleFields(fields: Map<JSONDataKey, String>, scopeKey: String) {
    val iterator = fields.entries.iterator()
    while (iterator.hasNext()) {
      val entry = iterator.next()
      deleteJSONDataForKeyInternal(entry.key.key, scopeKey)
      insertJSONDataInternal(JSONDataEntity(entry.key.key, entry.value, Date(), scopeKey))
    }
  }

  @Transaction
  open fun updateJSONStringForKey(key: JSONDataKey, scopeKey: String, updater: (previousValue: String?) -> String) {
    val previousValue = loadJSONStringForKey(key, scopeKey)
    deleteJSONDataForKeyInternal(key.key, scopeKey)
    insertJSONDataInternal(JSONDataEntity(key.key, updater(previousValue), Date(), scopeKey))
  }

  @Transaction
  open fun deleteJSONDataForKeysForAllScopeKeys(keys: List<JSONDataKey>) {
    deleteJSONDataForKeysForAllScopeKeysInternal(keys.map { it.key })
  }
}
