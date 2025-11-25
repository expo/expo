// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LabelViewProps: UIBaseViewProps {
  @Field var title: String?
  @Field var systemImage: String?
}

struct LabelView: ExpoSwiftUI.View {
  @ObservedObject var props: LabelViewProps

  var body: some View {
    if let title = props.title, let systemImage = props.systemImage {
      Label(title, systemImage: systemImage)
    }
    else if let title = props.title {
      Label(title, systemImage: "").labelStyle(.titleOnly)
    }
  }
}
