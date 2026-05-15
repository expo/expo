// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum TextInputAutocapitalizationType: String, Enumerable {
  case never
  case words
  case sentences
  case characters
}

internal struct TextInputAutocapitalizationModifier: ViewModifier, Record {
  @Field var autocapitalization: TextInputAutocapitalizationType = .sentences

  func body(content: Content) -> some View {
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
  }
}
