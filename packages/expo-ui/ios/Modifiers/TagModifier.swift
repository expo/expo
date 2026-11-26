// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func tagModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let tag: Either<String, Double>? = try p.value("tag", nil)
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
