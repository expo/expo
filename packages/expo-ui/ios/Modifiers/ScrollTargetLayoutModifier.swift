// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ScrollTargetLayoutModifier: ViewModifier, Record {
  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
      content.scrollTargetLayout()
    } else {
      content
    }
  }
}
