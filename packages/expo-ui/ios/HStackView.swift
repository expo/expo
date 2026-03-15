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
  @Field var scrollTargetLayout: Bool = false
}

public struct HStackView: ExpoSwiftUI.View {
  @ObservedObject public var props: HStackViewProps

  public init(props: HStackViewProps) {
    self.props = props
  }

  public var body: some View {
    let stack = HStack(
      alignment: props.alignment?.toVerticalAlignment() ?? .center,
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
