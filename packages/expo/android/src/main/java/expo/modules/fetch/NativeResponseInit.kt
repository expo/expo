// Copyright 2015-present 650 Industries. All rights reserved.

package expo.modules.fetch

internal data class NativeResponseInit(
  val headers: List<Pair<String, String>>,
  val status: Int,
  val statusText: String,
  val url: String,
  val redirected: Boolean
)
