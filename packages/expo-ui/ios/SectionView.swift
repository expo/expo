// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class SectionProps: ExpoSwiftUI.ViewProps {
  @Field var title: String?
  @Field var heightOffset: CGFloat = 0
}

struct SectionView: ExpoSwiftUI.View {
  @EnvironmentObject var props: SectionProps

  var body: some View {
    var form = Form {
      Section(header: Text(props.title ?? "")) {
        Children().padding(EdgeInsets(top: 0, leading: 0, bottom: props.heightOffset, trailing: 0))
      }
    }
    
    if #available(iOS 16.0, *) {
      form.scrollDisabled(true)
    } else {
      form
    }
  }
}
