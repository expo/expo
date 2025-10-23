// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class LabeledContentProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var label: String?
}

internal struct LabeledContentView: ExpoSwiftUI.View {
  @ObservedObject var props: LabeledContentProps

  var body: some View {
    if #available(iOS 16.0, tvOS 16.0, *) {
      LabeledContent(props.label ?? "") {
        Children()
      }
      .modifier(CommonViewModifiers(props: props))
    }
  }
}
