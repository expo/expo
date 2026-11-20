// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ProgressViewStyleType: String, UIEnum {
  case automatic
  case linear
  case circular

  @ViewBuilder
  func apply<Content: View>(to content: Content) -> some View {
    switch self {
    case .linear:
      content.progressViewStyle(.linear)
    case .circular:
      content.progressViewStyle(.circular)
    default:
      content.progressViewStyle(.automatic)
    }
  }
}

@MainActor @AnyViewBuilder
internal func progressViewStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: ProgressViewStyleType? = try p.value("style", nil)
  if let style = style {
    style.apply(to: content)
  } else {
    content
  }
}
