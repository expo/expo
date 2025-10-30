// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LabelViewProps: UIBaseViewProps {
  @Field var title: String?
  @Field var systemImage: String?
  @Field var color: Color?
}

struct LabelView: ExpoSwiftUI.View {
  @ObservedObject var props: LabelViewProps
  
  var body: some View {
    Label {
      Text(props.title ?? "")
    } icon: {
      if let systemImage = props.systemImage, !systemImage.isEmpty {
        Image(systemName: systemImage)
          .foregroundStyle(props.color ?? .accentColor)
      }
    }
    .labelStyle(.titleAndIcon) // ensures proper layout when icon exists
    .applyFixedSize(props.fixedSize ?? true)
  }
}
