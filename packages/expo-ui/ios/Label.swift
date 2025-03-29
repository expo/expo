// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class LabelViewProps: ExpoSwiftUI.ViewProps {
  @Field var title: String?
  @Field var systemImage: String?
  @Field var color: Color?
}

struct LabelView: ExpoSwiftUI.View {
  @EnvironmentObject var props: LabelViewProps
  @EnvironmentObject var shadowNodeProxy: ExpoSwiftUI.ShadowNodeProxy
  var body: some View {
    ExpoSwiftUI.AutoSizingStack(shadowNodeProxy: shadowNodeProxy, axis: .both) {
      Label(
        title: { Text(props.title ?? "") },
        icon: { Image(systemName: props.systemImage ?? "").foregroundStyle(props.color ?? Color.accentColor) }
      )
      .fixedSize()
    }
  }
}
