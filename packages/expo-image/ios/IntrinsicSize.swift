import Foundation

// Copyright 2022-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct IntrinsicSize: Record, Equatable {
  @Field
  var width: Double?

  @Field
  var height: Double?

  static func == (lhs: IntrinsicSize, rhs: IntrinsicSize) -> Bool {
    return lhs.width == rhs.width && lhs.height == rhs.height
  }
}
