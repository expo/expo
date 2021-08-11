// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.storage

import com.raizlabs.android.dbflow.annotation.Column
import com.raizlabs.android.dbflow.annotation.PrimaryKey
import com.raizlabs.android.dbflow.annotation.Table

@Table(database = ExponentDB::class)
class ExperienceDBObject(
  @PrimaryKey @Column(name = "id") var scopeKey: String? = null,
  @Column var manifestUrl: String? = null,
  @Column var bundleUrl: String? = null,
  @Column var manifest: String? = null
)
