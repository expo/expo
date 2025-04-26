// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class FormViewProps: ExpoSwiftUI.ViewProps {
}

internal struct FormView: ExpoSwiftUI.View {
  @ObservedObject var props: FormViewProps

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
