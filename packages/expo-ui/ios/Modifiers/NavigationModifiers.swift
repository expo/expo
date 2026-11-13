// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum NavigationSplitViewStyleOptions: String, Enumerable {
  case automatic
  case balanced
  case prominentDetail
}

internal struct NavigationSplitViewStyleModifier: ViewModifier, Record {
  @Field var style: NavigationSplitViewStyleOptions = .automatic

  @ViewBuilder
  func body(content: Content) -> some View {
    switch style {
    case .automatic:
      content.navigationSplitViewStyle(.automatic)
    case .balanced:
      content.navigationSplitViewStyle(.balanced)
    case .prominentDetail:
      content.navigationSplitViewStyle(.prominentDetail)
    }
  }
}

internal struct NavigationSplitViewColumnWidthModifier: ViewModifier, Record {
  @Field var width: CGFloat?
  @Field var min: CGFloat?
  @Field var ideal: CGFloat?
  @Field var max: CGFloat?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let width {
      content.navigationSplitViewColumnWidth(width)
    } else if let ideal {
      content.navigationSplitViewColumnWidth(min: min, ideal: ideal, max: max)
    } else {
      content
    }
  }
}
