package expo.modules.updates.db.entity

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import java.util.*

@Entity(
  tableName = "updates_assets",
  primaryKeys = ["update_id", "asset_id"],
  foreignKeys = [
    ForeignKey(
      entity = UpdateEntity::class,
      parentColumns = ["id"],
      childColumns = ["update_id"],
      onDelete = ForeignKey.CASCADE
    ), ForeignKey(
      entity = AssetEntity::class,
      parentColumns = ["id"],
      childColumns = ["asset_id"],
      onDelete = ForeignKey.CASCADE
    )
  ],
  indices = [Index(value = ["asset_id"])]
)
class UpdateAssetEntity(
  @field:ColumnInfo(name = "update_id") var updateId: UUID,
  @field:ColumnInfo(name = "asset_id") var assetId: Long
)
