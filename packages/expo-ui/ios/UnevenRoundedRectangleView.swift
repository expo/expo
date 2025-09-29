// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class UnevenRoundedRectangleViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var topLeadingRadius: CGFloat = 0
  @Field var topTrailingRadius: CGFloat = 0
  @Field var bottomLeadingRadius: CGFloat = 0
  @Field var bottomTrailingRadius: CGFloat = 0
}

internal struct UnevenRoundedRectangleView: ExpoSwiftUI.View {
  @ObservedObject var props: UnevenRoundedRectangleViewProps

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      UnevenRoundedRectangle(
        topLeadingRadius: props.topLeadingRadius,
        bottomLeadingRadius: props.bottomLeadingRadius,
        bottomTrailingRadius: props.bottomTrailingRadius,
        topTrailingRadius: props.topTrailingRadius
      )
      .modifier(CommonViewModifiers(props: props))
    } else {
      EmptyView()
    }
  }
}
