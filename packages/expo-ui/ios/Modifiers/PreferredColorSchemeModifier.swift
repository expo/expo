// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct PreferredColorSchemeModifier: ViewModifier, Record {
  @Field var colorScheme: ColorSchemeType?

  func body(content: Content) -> some View {
    content.preferredColorScheme(colorScheme?.toNativeColorScheme())
  }
}
