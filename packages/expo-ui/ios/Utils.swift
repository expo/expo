// Copyright 2025-present 650 Industries. All rights reserved.
import SwiftUI

// Allows conditionally applying transforms to SwiftUI views.
internal extension View {
  @ViewBuilder
  func `if`<Transform: View>(
    _ condition: Bool,
    transform: (Self) -> Transform
  ) -> some View {
    if condition {
      transform(self)
    } else {
      self
    }
  }
}
