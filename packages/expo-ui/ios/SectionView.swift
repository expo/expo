// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SectionProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var title: String?
}

internal struct SectionView: ExpoSwiftUI.View {
  @ObservedObject var props: SectionProps

  var body: some View {
    Section(header: Text(props.title ?? "").textCase(nil)) {
      Children()
    }
    .modifier(CommonViewModifiers(props: props))
  }
}
