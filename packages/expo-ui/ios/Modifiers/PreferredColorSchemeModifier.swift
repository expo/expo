// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func preferredColorSchemeModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let colorScheme: ColorSchemeType? = try p.value("colorScheme", nil)
  content.preferredColorScheme(colorScheme?.toNativeColorScheme())
}
