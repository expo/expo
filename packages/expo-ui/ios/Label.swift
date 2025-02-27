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
  
  var body: some View {
    Label(
      title: { Text(props.title ?? "") },
      icon: { Image(systemName: props.systemImage ?? "") }
    )
    .if(props.color != nil) {
      $0.accentColor(props.color!)
    }
  }
}
