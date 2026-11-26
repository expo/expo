// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func scrollTargetLayoutModifier(_ content: StableContent, _: ModifierParams) throws -> AnyView {
  if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
    content.scrollTargetLayout()
  } else {
    content
  }
}
