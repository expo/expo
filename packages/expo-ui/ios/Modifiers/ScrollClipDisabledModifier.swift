// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ScrollClipDisabledModifier: ViewModifier, UIRecord {
  @Field var disabled: Bool = true

  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, *) {
      content.scrollClipDisabled(disabled)
    } else {
      content
    }
  }
}
