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
  @Field var scrollTargetLayout: Bool = false
}

public struct VStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: VStackViewProps

  public init(props: VStackViewProps) {
    self.props = props
  }

  public var body: some View {
    let stack = VStack(
      alignment: props.alignment?.toHorizontalAlignment() ?? .center,
      spacing: CGFloat(props.spacing ?? 0)) {
        Children()
    }
    if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *), props.scrollTargetLayout {
      stack.scrollTargetLayout()
    } else {
      stack
    }
  }
}
