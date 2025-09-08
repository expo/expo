// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ZStackViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var useTapGesture: Bool?
  @Field var alignment: AlignmentOptions?
  @Field var backgroundColor: Color?
  var onTap = EventDispatcher()
}

internal struct ZStackView: ExpoSwiftUI.View {
  @ObservedObject var props: ZStackViewProps

  var body: some View {
    ZStack(alignment: props.alignment?.toAlignment() ?? .center) {
      Children()
    }
    .modifier(CommonViewModifiers(props: props))
    .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap, useContentShape: true)
  }
}
