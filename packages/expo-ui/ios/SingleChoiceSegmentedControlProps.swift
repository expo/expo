// Copyright 2025-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

class SingleChoiceSegmentedControlProps: ExpoSwiftUI.ViewProps {
  @Field var options: [String] = []
  @Field var selectedIndex: Int?
  var onOptionSelected = EventDispatcher()
}
