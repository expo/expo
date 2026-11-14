// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct LabelReservedIconWidthModifier: ViewModifier, Record {
  @Field var width: CGFloat = 0

  func body(content: Content) -> some View {
    #if compiler(>=6.2)
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
      content.labelReservedIconWidth(width)
    } else {
      content
    }
    #else
    content
    #endif
  }
}
