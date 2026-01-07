// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ScrollDisabledModifier: ViewModifier, Record {
  @Field var disabled: Bool = false

  func body(content: Content) -> some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      content.scrollDisabled(disabled)
    } else {
      content
    }
  }
}
