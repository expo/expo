// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LabelViewProps: ExpoSwiftUI.ViewProps {
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
    .fixedSize()
  }
}
