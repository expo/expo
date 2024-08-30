
// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal data class IOSOptions(
  @Field
  val appGroup: String?,
) : Record
