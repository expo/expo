// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct TagModifier: ViewModifier, Record {
  @Field var tag: Either<String, Double>?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let tag {
      if let stringTag: String = tag.get() {
        content.tag(AnyHashable(stringTag))
      } else if let doubleTag: Double = tag.get() {
        content.tag(AnyHashable(doubleTag))
      } else {
        content
      }
    } else {
      content
    }
  }
}
