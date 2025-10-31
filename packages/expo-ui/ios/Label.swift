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
    if let title = props.title, let systemImage = props.systemImage {
      // TODO: Deprecate this - recommend using foregroundStyle modifier
      if let color = props.color {
        Label(title, systemImage: systemImage).foregroundStyle(color)
          .applyFixedSize(props.fixedSize ?? true)
      } else {
        Label(title, systemImage: systemImage)
          .applyFixedSize(props.fixedSize ?? true)
      }
    }
    // TODO: Deprecate this - recommend using labelStyle modifier
    else if let title = props.title {
      Label(title, systemImage: "").labelStyle(.titleOnly)
        .applyFixedSize(props.fixedSize ?? true)
    }
  }
}
