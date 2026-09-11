// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum EnvironmentKeyType: String, Enumerable {
  case editMode
  case colorScheme
  case locale
  case timeZone
}

internal enum EditModeType: String, Enumerable {
  case active
  case inactive
  case transient

#if !os(macOS)
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
#endif
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
      // `EditMode` and the `editMode` environment key are both unavailable on macOS, which has
      // no list edit mode. Setting the key is a no-op there.
#if os(macOS)
      content
#else
      if let editMode = EditModeType(rawValue: value) {
        content.environment(\.editMode, .constant(editMode.toNativeEditMode()))
      } else {
        content
      }
#endif
    case .colorScheme:
      if let colorScheme = ColorSchemeType(rawValue: value) {
        content.environment(\.colorScheme, colorScheme.toNativeColorScheme())
      } else {
        content
      }
    case .locale:
      if Locale.availableIdentifiers.contains(value) {
        content.environment(\.locale, Locale(identifier: value))
      } else {
        content
      }
    case .timeZone:
      if let tz = TimeZone(identifier: value) {
        content.environment(\.timeZone, tz)
      } else {
        content
      }
    }
  }
}
