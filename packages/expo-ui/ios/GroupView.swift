// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class GroupViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var useTapGesture: Bool?
  var onTap = EventDispatcher()
}

internal struct GroupView: ExpoSwiftUI.View {
  @ObservedObject var props: GroupViewProps

  var body: some View {
    Group {
      Children()
    }
    .modifier(CommonViewModifiers(props: props))
    .applyOnTapGesture(useTapGesture: props.useTapGesture, eventDispatcher: props.onTap, useContentShape: true)
  }
}
