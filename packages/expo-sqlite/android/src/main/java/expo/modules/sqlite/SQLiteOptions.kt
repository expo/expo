// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.sqlite

import io.github.expo.modules.v2.Record

@Record
internal data class OpenDatabaseOptions(
  val enableChangeListener: Boolean = false,
  val useNewConnection: Boolean = false,
  val finalizeUnusedStatementsBeforeClosing: Boolean = true
)
