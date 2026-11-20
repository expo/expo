// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum GaugeStyleType: String, UIEnum {
  case automatic
  case circular
  case circularCapacity
  case linear
  case linearCapacity

#if !os(tvOS)
  @available(iOS 16.0, *)
  @ViewBuilder
  func apply<Content: View>(to content: Content) -> some View {
    switch self {
    case .circular:
      content.gaugeStyle(.accessoryCircular)
    case .circularCapacity:
      content.gaugeStyle(.accessoryCircularCapacity)
    case .linear:
      content.gaugeStyle(.accessoryLinear)
    case .linearCapacity:
      content.gaugeStyle(.accessoryLinearCapacity)
    default:
      content.gaugeStyle(.automatic)
    }
  }
#endif
}

@MainActor @AnyViewBuilder
internal func gaugeStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: GaugeStyleType? = try p.value("style", nil)
#if !os(tvOS)
  if #available(iOS 16.0, *) {
    if let style = style {
      style.apply(to: content)
    } else {
      content
    }
  } else {
    content
  }
#else
  content
#endif
}
