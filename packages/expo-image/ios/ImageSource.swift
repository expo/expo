// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

struct ImageSource: Record {
  @Field
  var width: Double = 0.0

  @Field
  var height: Double = 0.0

  @Field
  var uri: URL? = nil

  @Field
  var scale: Double = 1.0

  @Field
  var headers: [String: String]?

  var pixelCount: Double {
    return width * height * scale * scale
  }
}
