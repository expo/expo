package expo.modules.updates.db.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.Index
import androidx.room.PrimaryKey
import java.util.*

@Entity(tableName = "json_data", indices = [Index(value = ["scope_key"])])
class JSONDataEntity(
  var key: String,
  var value: String,
  @field:ColumnInfo(name = "last_updated") var lastUpdated: Date,
  @field:ColumnInfo(name = "scope_key") var scopeKey: String
) {
  @PrimaryKey(autoGenerate = true) // 0 is treated as unset while inserting the entity into the db
  var id: Long = 0
}
