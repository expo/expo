// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func scrollDisabledModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let disabled: Bool = try p.value("disabled", true)
  if #available(iOS 16.0, tvOS 16.0, *) {
    content.scrollDisabled(disabled)
  } else {
    content
  }
}
