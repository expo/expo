// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUIHStackProps: ExpoSwiftUI.ViewProps {
  @Field var spacing: Double?
  @Field var padding: Double?
  @Field var frame: [String: Double]?
}

struct SwiftUIHStack: ExpoSwiftUI.View {
  @ObservedObject var props: SwiftUIHStackProps

  var body: some View {
    HStack(spacing: CGFloat(props.spacing ?? 0)) {
      Children()
    }
    .padding(props.padding ?? 0)
    .frame(
      minWidth: props.frame?["minWidth"].map { CGFloat($0) },
      idealWidth: props.frame?["width"].map { CGFloat($0) },
      maxWidth: props.frame?["maxWidth"].map { CGFloat($0) },
      minHeight: props.frame?["minHeight"].map { CGFloat($0) },
      idealHeight: props.frame?["height"].map { CGFloat($0) },
      maxHeight: props.frame?["maxHeight"].map { CGFloat($0) },
      alignment: .center
    )
    .fixedSize(
      horizontal: props.frame?["width"] != nil,
      vertical: props.frame?["height"] != nil
    )
  }
}
