// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct ImageSource: Record {
  @Field
  var width: Double?

  @Field
  var height: Double?

  @Field
  var uri: URL?

  @Field
  var scale: Double = 1.0

  @Field
  var headers: [String: String]?
}
