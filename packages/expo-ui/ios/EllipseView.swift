// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class EllipseViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?
}

internal struct EllipseView: ExpoSwiftUI.View {
  @ObservedObject var props: EllipseViewProps

  var body: some View {
    Ellipse()
      .modifier(CommonViewModifiers(props: props))
  }
}
