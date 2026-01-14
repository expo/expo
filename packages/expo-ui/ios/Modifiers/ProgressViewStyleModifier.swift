// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ProgressViewStyleType: String, Enumerable {
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

internal struct ProgressViewStyleModifier: ViewModifier, Record {
  @Field var style: ProgressViewStyleType?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let style = style {
      style.apply(to: content)
    } else {
      content
    }
  }
}
