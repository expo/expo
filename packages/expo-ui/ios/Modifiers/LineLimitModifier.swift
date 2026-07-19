// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct LineLimitModifier: ViewModifier, Record {
  @Field var limit: Int?
  @Field var min: Int?
  @Field var max: Int?
  @Field var reservesSpace: Bool?

  func body(content: Content) -> some View {
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
}
