// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LabelViewProps: ExpoSwiftUI.ViewProps, CommonViewModifierProps {
  @Field var fixedSize: Bool?
  @Field var frame: FrameOptions?
  @Field var padding: PaddingOptions?
  @Field var testID: String?
  @Field var modifiers: ModifierArray?

  @Field var title: String?
  @Field var systemImage: String?
  @Field var color: Color?
}

struct LabelView: ExpoSwiftUI.View {
  @ObservedObject var props: LabelViewProps

  var body: some View {
    Label(
      title: { Text(props.title ?? "") },
      icon: { Image(systemName: props.systemImage ?? "").foregroundStyle(props.color ?? Color.accentColor) }
    )
    .modifier(CommonViewModifiers(props: props))
    .applyFixedSize(props.fixedSize ?? true)
  }
}
