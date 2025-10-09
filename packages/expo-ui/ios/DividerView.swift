// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal class DividerProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?
}

internal struct DividerView: ExpoSwiftUI.View {
  @ObservedObject var props: DividerProps

  var body: some View {
    Divider()
      .modifier(CommonViewModifiers(props: props))
  }
}
