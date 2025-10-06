// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class CircleViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?
}

internal struct CircleView: ExpoSwiftUI.View {
  @ObservedObject var props: CircleViewProps

  var body: some View {
    Circle()
      .modifier(CommonViewModifiers(props: props))
  }
}
