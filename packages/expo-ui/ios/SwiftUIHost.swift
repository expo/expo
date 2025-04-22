// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUIHostProps: ExpoSwiftUI.ViewProps {
}
struct SwiftUIHost: ExpoSwiftUI.View, ExpoSwiftUI.WithHostingView {
  @ObservedObject var props: SwiftUIHostProps
  var body: some View {
    Children()
  }
}
