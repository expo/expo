// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum TextInputAutocapitalizationType: String, Enumerable {
  case never
  case words
  case sentences
  case characters
}

@MainActor @AnyViewBuilder
internal func textInputAutocapitalizationModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let autocapitalization: TextInputAutocapitalizationType = try p.value("autocapitalization", .sentences)
#if os(macOS)
  // Autocapitalization is a software-keyboard behaviour and `textInputAutocapitalization`
  // is unavailable on macOS, so the modifier is a no-op there.
  content
#else
  switch autocapitalization {
  case .never:
    content.textInputAutocapitalization(.never)
  case .words:
    content.textInputAutocapitalization(.words)
  case .sentences:
    content.textInputAutocapitalization(.sentences)
  case .characters:
    content.textInputAutocapitalization(.characters)
  }
#endif
}
