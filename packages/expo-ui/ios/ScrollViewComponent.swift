// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ViewProps(extending: ExpoUIViewProps.self)
public struct ScrollViewComponentProps {
  var axes: AxisOptions = .vertical
  var showsIndicators: Bool = true
}

@ExpoView<ScrollViewComponentProps>
public struct ScrollViewComponent: View {
  // A fraction on this view is a real size only when the parent opted in.
  @Environment(\.universalPercentageParent) private var resolvesOwnPercentage

  public var body: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      children
    }
    // The cross axis resolves a child percentage against the viewport.
    // The scroll axis stays unbounded, so a percentage on that axis does not.
    .environment(\.universalPercentageParent, resolvesChildPercentages)
    .applyExpoUIViewProps(props.base, appContext: appContext)
  }

  /// A vertical scroll view fills the width it is offered.
  /// A horizontal scroll view takes its height from its content unless a size sets it.
  /// That content height is not a percentage base.
  private var resolvesChildPercentages: Bool {
    switch props.axes {
    case .vertical:
      return true
    case .horizontal:
      let dimensions = universalLayoutDimensions(from: props.base.modifiers?.modifiers)
      return dimensions.heightPoints != nil || (dimensions.heightFraction != nil && resolvesOwnPercentage)
    case .both:
      return false
    }
  }
}
