// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

class ListViewProps: ExpoSwiftUI.ViewProps {
  
}


struct ListView: ExpoSwiftUI.View {
  @EnvironmentObject var props: ListViewProps
  
  var body: some View {
    List {
      Text("A List Item")
      Text("A Second List Item")
      Text("A Third List Item")
    }
  }
}
