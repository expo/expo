// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Record for RequestInit.
 */
internal struct NativeRequestInit: Record {
  @Field
  var credentials: NativeRequestCredentials = .include

  @Field
  var headers: [[String]] = []

  @Field
  var method: String = "GET"
}
