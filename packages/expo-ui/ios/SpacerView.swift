// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class SpacerViewProps: UIBaseViewProps {
  @Field var minLength: Double?
}

internal struct SpacerView: ExpoSwiftUI.View {
  @ObservedObject var props: SpacerViewProps

  var body: some View {
    Spacer(minLength: props.minLength.map { CGFloat($0) })
  }
}
