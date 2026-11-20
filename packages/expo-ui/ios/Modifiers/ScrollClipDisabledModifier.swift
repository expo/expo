// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func scrollClipDisabledModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let disabled: Bool = try p.value("disabled", true)
  if #available(iOS 17.0, tvOS 17.0, *) {
    content.scrollClipDisabled(disabled)
  } else {
    content
  }
}
