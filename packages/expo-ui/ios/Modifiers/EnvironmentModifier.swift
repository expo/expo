// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum EnvironmentKeyType: String, Enumerable {
  case editMode
  case colorScheme
}

internal enum EditModeType: String, Enumerable {
  case active
  case inactive
  case transient

  func toNativeEditMode() -> EditMode {
    switch self {
    case .active:
      return .active
    case .inactive:
      return .inactive
    case .transient:
      return .transient
    }
  }
}

internal enum ColorSchemeType: String, Enumerable {
  case light
  case dark

  func toNativeColorScheme() -> SwiftUI.ColorScheme {
    switch self {
    case .light:
      return .light
    case .dark:
      return .dark
    }
  }
}

internal struct EnvironmentModifier: ViewModifier, Record {
  @Field var key: EnvironmentKeyType = .editMode
  @Field var value: String = ""

  @ViewBuilder
  func body(content: Content) -> some View {
    switch key {
    case .editMode:
      if let editMode = EditModeType(rawValue: value) {
        content.environment(\.editMode, .constant(editMode.toNativeEditMode()))
      } else {
        content
      }
    case .colorScheme:
      if let colorScheme = ColorSchemeType(rawValue: value) {
        content.environment(\.colorScheme, colorScheme.toNativeColorScheme())
      } else {
        content
      }
    }
  }
}
