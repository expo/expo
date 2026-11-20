// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum NavigationSplitViewStyleOptions: String, UIEnum {
  case automatic
  case balanced
  case prominentDetail
}

@MainActor @AnyViewBuilder
internal func navigationSplitViewStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: NavigationSplitViewStyleOptions = try p.value("style", .automatic)
  switch style {
  case .automatic:
    content.navigationSplitViewStyle(.automatic)
  case .balanced:
    content.navigationSplitViewStyle(.balanced)
  case .prominentDetail:
    content.navigationSplitViewStyle(.prominentDetail)
  }
}

@MainActor @AnyViewBuilder
internal func navigationSplitViewColumnWidthModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let width: CGFloat? = try p.value("width", nil)
  let min: CGFloat? = try p.value("min", nil)
  let ideal: CGFloat? = try p.value("ideal", nil)
  let max: CGFloat? = try p.value("max", nil)
  if let width {
    content.navigationSplitViewColumnWidth(width)
  } else if let ideal {
    content.navigationSplitViewColumnWidth(min: min, ideal: ideal, max: max)
  } else {
    content
  }
}
