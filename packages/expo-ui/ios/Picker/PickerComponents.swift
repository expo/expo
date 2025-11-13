// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

internal final class PickerContentProps: ExpoSwiftUI.ViewProps {}

internal final class PickerLabelProps: ExpoSwiftUI.ViewProps {}

internal struct PickerContentView: ExpoSwiftUI.View {
  @ObservedObject var props: PickerContentProps

  var body: some View {
    Children()
  }
}

internal struct PickerLabelView: ExpoSwiftUI.View {
  @ObservedObject var props: PickerLabelProps

  var body: some View {
    Children()
  }
}
