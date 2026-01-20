// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore
import ExpoUI

final class MyCustomViewProps: UIBaseViewProps {
  @Field var title: String = ""
}

struct MyCustomView: ExpoSwiftUI.View {
  @ObservedObject var props: MyCustomViewProps

  var body: some View {
    VStack {
      Text(props.title)
        .font(.headline)
      Children()
    }
  }
}
