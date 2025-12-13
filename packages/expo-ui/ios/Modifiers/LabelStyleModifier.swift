// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum LabelStyleType: String, Enumerable {
  case automatic
  case iconOnly
  case titleAndIcon
  case titleOnly

  @ViewBuilder
  func apply<Content: View>(to content: Content) -> some View {
    switch self {
    case .automatic:
      content.labelStyle(.automatic)
    case .iconOnly:
      content.labelStyle(.iconOnly)
    case .titleAndIcon:
      content.labelStyle(.titleAndIcon)
    case .titleOnly:
      content.labelStyle(.titleOnly)
    }
  }
}

internal struct LabelStyleModifier: ViewModifier, Record {
  @Field var style: LabelStyleType?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let style {
      style.apply(to: content)
    } else {
      content
    }
  }
}
