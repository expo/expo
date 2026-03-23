// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 Observable state for Toggle, created from JavaScript and observed by SwiftUI.
 */
internal final class ToggleState: ObservableState {
  @Published var isOn: Bool = false
}
