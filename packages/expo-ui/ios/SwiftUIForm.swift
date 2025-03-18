// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUIFormProps: ExpoSwiftUI.ViewProps {
}

struct SwiftUIForm: ExpoSwiftUI.View {
  @ObservedObject var props: SwiftUIFormProps

  var body: some View {
    let form = Form {
      Children()
    }

    if #available(iOS 16.0, tvOS 16.0, *) {
      form.scrollDisabled(true)
    } else {
      form
    }
  }
}
