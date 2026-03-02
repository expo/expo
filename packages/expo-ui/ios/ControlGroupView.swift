// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class ControlGroupViewProps: UIBaseViewProps {
  @Field var label: String?
  @Field var systemImage: String?
}

internal final class ControlGroupLabelProps: ExpoSwiftUI.ViewProps {}

internal struct ControlGroupLabel: ExpoSwiftUI.View {
  @ObservedObject var props: ControlGroupLabelProps

  var body: some View {
    Children()
  }
}

internal struct ControlGroupView: ExpoSwiftUI.View {
  @ObservedObject var props: ControlGroupViewProps

  var body: some View {
    if #available(iOS 15.0, tvOS 17.0, *) {
      let labelContent = props.children?
        .compactMap { $0.childView as? ControlGroupLabel }
        .first

      if let systemImage = props.systemImage, let label = props.label {
        if #available(iOS 16.0, *) {
          ControlGroup(label, systemImage: systemImage) { Children() }
        } else {
          ControlGroup(label) { Children() }
        }
      } else if let labelContent {
        ControlGroup { Children() } label: { labelContent }
      } else if let label = props.label {
        ControlGroup(label) { Children() }
      } else {
        ControlGroup { Children() }
      }
    }
  }
}
