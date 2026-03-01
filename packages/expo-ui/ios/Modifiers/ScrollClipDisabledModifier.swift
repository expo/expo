// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ScrollClipDisabledModifier: ViewModifier, Record {
  @Field var disabled: Bool = true

  func body(content: Content) -> some View {
#if os(tvOS)
    content
#else
    if #available(iOS 17.0, *) {
      content.scrollClipDisabled(disabled)
    } else {
      content
    }
#endif
  }
}
