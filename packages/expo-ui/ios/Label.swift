// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

final class LabelViewProps: UIBaseViewProps {
  @Field var title: String?
  @Field var systemImage: String?
}

internal final class LabelIconProps: ExpoSwiftUI.ViewProps {}
internal struct LabelIcon: ExpoSwiftUI.View {
  @ObservedObject var props: LabelIconProps

  var body: some View {
    Children()
  }
}

struct LabelView: ExpoSwiftUI.View {
  @ObservedObject var props: LabelViewProps

  var body: some View {
    if let title = props.title {
      if let customIcon {
        Label {
          Text(title)
        } icon: {
          customIcon
        }
      } else if let systemImage = props.systemImage {
        Label(title, systemImage: systemImage)
      } else {
        Label(title, systemImage: "").labelStyle(.titleOnly)
      }
    }
  }

  private var customIcon: LabelIcon? {
    props.children?
      .compactMap({ $0.childView as? LabelIcon })
      .first
  }
}
