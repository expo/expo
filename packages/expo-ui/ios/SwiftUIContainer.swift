// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUIContainerProps: ExpoSwiftUI.ViewProps {
}
struct SwiftUIContainer: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: SwiftUIContainerProps
  var body: some View {
    Children()
  }
}
