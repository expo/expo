// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class SpacerViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var minLength: Double?
}

internal struct SpacerView: ExpoSwiftUI.View {
  @ObservedObject var props: SpacerViewProps

  var body: some View {
    Spacer(minLength: props.minLength.map { CGFloat($0) })
      .modifier(CommonViewModifiers(props: props))
  }
}
