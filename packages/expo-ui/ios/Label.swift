// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

public final class LabelViewProps: UIBaseViewProps {
  @Field var title: String?
  @Field var systemImage: String?
}

public struct LabelView: ExpoSwiftUI.View {
  @ObservedObject public var props: LabelViewProps

  public init(props: LabelViewProps) {
    self.props = props
  }

  public var body: some View {
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

  private var customIcon: SlotView? {
    props.children?.slot("icon")
  }
}
