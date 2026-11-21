// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func moveDisabledModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let disabled: Bool = try p.value("disabled", true)
  content.moveDisabled(disabled)
}

@MainActor @AnyViewBuilder
internal func deleteDisabledModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let disabled: Bool = try p.value("disabled", true)
  content.deleteDisabled(disabled)
}
