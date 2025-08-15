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

internal final class VStackViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var spacing: Double?
  @Field var useTapGesture: Bool?
  @Field var alignment: HorizontalAlignmentOptions?
  @Field var backgroundColor: Color?
  var onTap = EventDispatcher()
}

internal struct VStackView: ExpoSwiftUI.View {
  @ObservedObject var props: VStackViewProps

  var body: some View {
    VStack(
      alignment: props.alignment?.toHorizontalAlignment() ?? .center,
      spacing: CGFloat(props.spacing ?? 0)) {
      Children()
    }
    .modifier(CommonViewModifiers(props: props))
    .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap, useContentShape: true)
    .background(props.backgroundColor)
  }
}
