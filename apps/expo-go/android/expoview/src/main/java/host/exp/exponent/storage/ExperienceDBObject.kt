// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.storage

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "ExperienceDBObject")
class ExperienceDBObject(
  @PrimaryKey @ColumnInfo(name = "id") var scopeKey: String = "",
  @ColumnInfo var manifestUrl: String? = null,
  @ColumnInfo var bundleUrl: String? = null,
  @ColumnInfo var manifest: String? = null
)
