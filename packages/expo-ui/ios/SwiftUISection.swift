// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUISectionProps: ExpoSwiftUI.ViewProps {
  @Field var title: String = ""
}

struct SwiftUISection: ExpoSwiftUI.View {
  @ObservedObject var props: SwiftUISectionProps

  var body: some View {
    Section(header: Text(props.title)) {
      Children()
    }
  }
}
