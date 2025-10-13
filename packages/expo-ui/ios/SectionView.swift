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

  @ViewBuilder
  private var section: some View {
    if let title = props.title, !title.isEmpty {
      Section(header: Text(title).textCase(nil)) {
        Children()
      }
    } else {
      Section {
        Children()
      }
    }
  }

  var body: some View {
    section
      .modifier(CommonViewModifiers(props: props))
  }
}
