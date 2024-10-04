// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

internal data class NativeRequestInit(
  @Field val credentials: NativeRequestCredentials = NativeRequestCredentials.INCLUDE,
  @Field val headers: List<Pair<String, String>> = emptyList(),
  @Field val method: String = "GET"
) : Record
