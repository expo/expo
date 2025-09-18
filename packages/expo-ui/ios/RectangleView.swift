// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RectangleViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?
}

internal struct RectangleView: ExpoSwiftUI.View {
  @ObservedObject var props: RectangleViewProps

  var body: some View {
    Rectangle()
      .modifier(CommonViewModifiers(props: props))
  }
}
