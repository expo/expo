// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum GaugeStyleType: String, Enumerable {
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

internal struct GaugeStyleModifier: ViewModifier, Record {
  @Field var style: GaugeStyleType?

  @ViewBuilder
  func body(content: Content) -> some View {
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
}
