// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal data class OpenDatabaseOptions(
  @Field
  val enableChangeListener: Boolean = false,

  @Field
  val useNewConnection: Boolean = false,

  @Field
  val finalizeUnusedStatementsBeforeClosing: Boolean = true,

  @Field
  val libSQLUrl: String? = null,

  @Field
  val libSQLAuthToken: String? = null,

  @Field
  val libSQLRemoteOnly: Boolean = false
) : Record
