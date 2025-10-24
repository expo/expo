// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class RoundedRectangleViewProps: UIBaseViewProps {
  @Field var cornerRadius: CGFloat = 0
}

internal struct RoundedRectangleView: ExpoSwiftUI.View {
  @ObservedObject var props: RoundedRectangleViewProps

  var body: some View {
    RoundedRectangle(cornerRadius: props.cornerRadius)
  }
}
