// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum EnvironmentKeyType: String, UIEnum {
  case editMode
  case colorScheme
  case locale
  case timeZone
}

internal enum EditModeType: String, UIEnum {
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

internal enum ColorSchemeType: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func environmentModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let key: EnvironmentKeyType = try p.value("key", .editMode)
  let value: String = try p.value("value", "")
  switch key {
  case .editMode:
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
