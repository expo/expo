// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

@ExpoView<ExpoUIViewProps>
public struct FormView: View {
  public var body: some View {
    Form {
      children
    }
    .applyExpoUIViewProps(props, appContext: appContext)
  }
}
