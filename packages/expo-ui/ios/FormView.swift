// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class FormViewProps: UIBaseViewProps {
}

internal struct FormView: ExpoSwiftUI.View {
  @ObservedObject var props: FormViewProps

  var body: some View {
    Form {
      Children()
    }
  }
}
