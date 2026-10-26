// Copyright 2026-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

public final class ScrollViewComponentProps: UIBaseViewProps {
  @Field var axes: AxisOptions = .vertical
  @Field var showsIndicators: Bool = true
}

public struct ScrollViewComponent: ExpoSwiftUI.View {
  @ObservedObject public var props: ScrollViewComponentProps
  // A fraction on this view is a real size only when the parent opted in.
  @Environment(\.resolvesOwnPercentage) private var resolvesOwnPercentage

  public init(props: ScrollViewComponentProps) {
    self.props = props
  }

  public var body: some View {
    ScrollView(props.axes.toAxis(), showsIndicators: props.showsIndicators) {
      Children()
    }
    // The cross axis resolves a child percentage against the viewport.
    // The scroll axis stays unbounded, so a percentage on that axis does not.
    .environment(\.universalPercentageParent, resolvesChildPercentages)
  }

  /// A vertical scroll view fills the width it is offered.
  /// A horizontal scroll view takes its height from its content unless a size sets it.
  /// That content height is not a percentage base.
  private var resolvesChildPercentages: Bool {
    switch props.axes {
    case .vertical:
      return true
    case .horizontal:
      let dimensions = universalLayoutDimensions(from: props.modifiers)
      return dimensions.heightPoints != nil || (dimensions.heightFraction != nil && resolvesOwnPercentage)
    case .both:
      return false
    }
  }
}
