// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

@MainActor @AnyViewBuilder
internal func scrollIndicatorsModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let visibility: ScrollIndicatorVisibilityOptions = try p.value("visibility", .automatic)
  let axes: AxisOptions = try p.value("axes", .both)
  content.scrollIndicators(visibility.toVisibility(), axes: axes.toAxis())
}
