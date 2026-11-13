// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct SectionIndexLabelModifier: ViewModifier, Record {
  @Field var label: String?

  @ViewBuilder
  func body(content: Content) -> some View {
    if #available(iOS 26.0, macOS 26.0, tvOS 26.0, *) {
#if compiler(>=6.2) // Xcode 26
      content.sectionIndexLabel(label)
#else
      content
#endif
    } else {
      content
    }
  }
}
