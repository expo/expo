// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct ScrollIndicatorsModifier: ViewModifier, Record {
  @Field var visibility: ScrollIndicatorVisibilityOptions = .automatic
  @Field var axes: AxisOptions = .both

  func body(content: Content) -> some View {
    content.scrollIndicators(visibility.toVisibility(), axes: axes.toAxis())
  }
}
