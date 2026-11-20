// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func iDModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let id: String = try p.value("id", "")
  content.id(id)
}
