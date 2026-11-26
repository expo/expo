// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func lineLimitModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let limit: Int? = try p.value("limit", nil)
  let min: Int? = try p.value("min", nil)
  let max: Int? = try p.value("max", nil)
  let reservesSpace: Bool? = try p.value("reservesSpace", nil)
  if let min, let max {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.lineLimit(min...max)
    } else {
      content.lineLimit(max)
    }
  } else if let reservesSpace, let limit {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.lineLimit(limit, reservesSpace: reservesSpace)
    } else {
      content.lineLimit(limit)
    }
  } else {
    content.lineLimit(limit)
  }
}
