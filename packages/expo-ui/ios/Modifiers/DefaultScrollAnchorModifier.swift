// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func defaultScrollAnchorModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let anchor: UnitPointOptions? = try p.value("anchor", nil)
  if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
    content.defaultScrollAnchor(anchor?.toUnitPoint)
  } else {
    content
  }
}
