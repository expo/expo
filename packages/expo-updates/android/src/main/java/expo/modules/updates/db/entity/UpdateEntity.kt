package expo.modules.updates.db.entity

import androidx.room.*
import expo.modules.updates.db.enums.UpdateStatus
import org.json.JSONObject
import java.util.*

@Entity(
  tableName = "updates",
  foreignKeys = [
    ForeignKey(
      entity = AssetEntity::class,
      parentColumns = ["id"],
      childColumns = ["launch_asset_id"],
      onDelete = ForeignKey.CASCADE
    )
  ],
  indices = [
    Index(value = ["launch_asset_id"]),
    Index(value = ["scope_key", "commit_time"], unique = true)
  ]
)
class UpdateEntity(
  @field:ColumnInfo(typeAffinity = ColumnInfo.BLOB) @field:PrimaryKey var id: UUID,
  @field:ColumnInfo(name = "commit_time") var commitTime: Date,
  @field:ColumnInfo(name = "runtime_version") var runtimeVersion: String,
  @field:ColumnInfo(name = "scope_key") var scopeKey: String
) {
  @ColumnInfo(name = "launch_asset_id")
  var launchAssetId: Long? = null

  @ColumnInfo(name = "manifest")
  var manifest: JSONObject? = null

  var status = UpdateStatus.PENDING

  var keep = false

  @ColumnInfo(name = "last_accessed")
  var lastAccessed: Date = Date()

  @ColumnInfo(name = "successful_launch_count", defaultValue = "0")
  var successfulLaunchCount = 0

  @ColumnInfo(name = "failed_launch_count", defaultValue = "0")
  var failedLaunchCount = 0
}
