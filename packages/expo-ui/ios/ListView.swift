// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class ListViewProps: ExpoSwiftUI.ViewProps {}

struct ListView: ExpoSwiftUI.View {
  @EnvironmentObject var props: ListViewProps
  
  var body: some View {
    List {
      UnwrappedChildren { child, isHostingView in
        child
      }
    }
  }
}
