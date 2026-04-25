// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.webview

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.OptimizedRecord

@OptimizedRecord
internal data class OnMessageEvent(
  @Field val title: String,
  @Field val url: String,
  @Field val data: String
) : Record
