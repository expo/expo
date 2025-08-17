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

internal final class HStackViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var spacing: Double?
  @Field var useTapGesture: Bool?
  @Field var alignment: VerticalAlignmentOptions?
  @Field var backgroundColor: Color?
  var onTap = EventDispatcher()
}

internal struct HStackView: ExpoSwiftUI.View {
  @ObservedObject var props: HStackViewProps

  var body: some View {
    HStack(
      alignment: props.alignment?.toVerticalAlignment() ?? .center,
      spacing: CGFloat(props.spacing ?? 0)) {
      Children()
    }
    .modifier(CommonViewModifiers(props: props))
    .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap, useContentShape: true)
    .background(props.backgroundColor)
  }
}
