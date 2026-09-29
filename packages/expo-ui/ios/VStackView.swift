// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal enum HorizontalAlignmentOptions: String, Enumerable {
  case leading
  case center
  case trailing

  func toHorizontalAlignment() -> HorizontalAlignment {
    switch self {
    case .leading:
      return .leading
    case .center:
      return .center
    case .trailing:
      return .trailing
    }
  }
}

public final class VStackViewProps: UIBaseViewProps {
  @Field var spacing: Double?
  @Field var alignment: HorizontalAlignmentOptions?
}

public struct VStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: VStackViewProps
  @Environment(\.layoutDirection) private var layoutDirection

  public init(props: VStackViewProps) {
    self.props = props
  }

  public var body: some View {
    if #available(iOS 16.0, tvOS 16.0, macOS 13.0, *) {
      ParentAwareVStackLayout(
        alignment: props.alignment ?? .center,
        spacing: props.spacing.map { CGFloat($0) },
        layoutDirection: layoutDirection,
        ownDimensions: universalLayoutDimensions(from: props.modifiers)
      ) {
        Children()
      }
    } else {
      VStack(
        alignment: props.alignment?.toHorizontalAlignment() ?? .center,
        spacing: props.spacing.map { CGFloat($0) }
      ) {
        Children()
      }
    }
  }
}
