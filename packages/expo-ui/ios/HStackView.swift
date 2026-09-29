// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum VerticalAlignmentOptions: String, Enumerable {
  case top
  case center
  case bottom
  case firstTextBaseline
  case lastTextBaseline

  func toVerticalAlignment() -> VerticalAlignment {
    switch self {
    case .top:
      return .top
    case .center:
      return .center
    case .bottom:
      return .bottom
    case .firstTextBaseline:
      return .firstTextBaseline
    case .lastTextBaseline:
      return .lastTextBaseline
    }
  }
}

public final class HStackViewProps: UIBaseViewProps {
  @Field var spacing: Double?
  @Field var alignment: VerticalAlignmentOptions?
  // Universal `Row` sets this so a child percentage is a fraction of this stack.
  // A SwiftUI `HStack` leaves it off and keeps the platform layout.
  @Field var resolvesChildPercentages: Bool = false
}

public struct HStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: HStackViewProps
  @Environment(\.layoutDirection) private var layoutDirection

  public init(props: HStackViewProps) {
    self.props = props
  }

  public var body: some View {
    if props.resolvesChildPercentages {
      if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
        ParentAwareHStackLayout(
          alignment: props.alignment ?? .center,
          spacing: props.spacing.map { CGFloat($0) },
          layoutDirection: layoutDirection,
          ownDimensions: universalLayoutDimensions(from: props.modifiers)
        ) {
          Children()
        }
      } else {
        platformStack
      }
    } else {
      platformStack
    }
  }

  private var platformStack: some View {
    HStack(
      alignment: props.alignment?.toVerticalAlignment() ?? .center,
      spacing: props.spacing.map { CGFloat($0) }
    ) {
      Children()
    }
  }
}
