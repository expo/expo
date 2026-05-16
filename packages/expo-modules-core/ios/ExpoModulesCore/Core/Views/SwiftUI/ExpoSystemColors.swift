// Copyright 2024-present 650 Industries. All rights reserved.

import SwiftUI

// Wrap system colors to hide platform differences

public extension Color {
  #if os(tvOS) || os(macOS)
  private static let _systemGray6: Color = Color(.systemGray.withAlphaComponent(0.5))
  private static let _systemGray5: Color = Color(.systemGray.withAlphaComponent(0.6))
  private static let _systemGray4: Color = Color(.systemGray.withAlphaComponent(0.7))
  private static let _systemBackground: Color = .clear
  private static let _systemGroupedBackground: Color = .white
  private static let _secondaryLabel: Color = .secondary
  private static let _secondarySystemBackground: Color = Color(.systemGray.withAlphaComponent(0.1))
  private static let _secondarySystemGroupedBackground: Color = Color(.systemGray.withAlphaComponent(0.2))
  #else
  private static let _systemGray6: Color = Color(.systemGray6)
  private static let _systemGray5: Color = Color(.systemGray5)
  private static let _systemGray4 = Color(.systemGray4)
  private static let _systemBackground: Color = Color(.systemBackground)
  private static let _systemGroupedBackground: Color = Color(.systemGroupedBackground)
  private static let _secondaryLabel: Color = Color(.secondaryLabel)
  private static let _secondarySystemBackground: Color = Color(.secondarySystemBackground)
  private static let _secondarySystemGroupedBackground: Color = Color(.secondarySystemGroupedBackground)
  #endif

  static let expoSystemBackground: Color = _systemBackground
  static let expoSystemGroupedBackground: Color = _systemGroupedBackground
  static let expoSecondaryLabel: Color = _secondaryLabel
  static let expoSecondarySystemBackground: Color = _secondarySystemBackground
  static let expoSecondarySystemGroupedBackground: Color = _secondarySystemGroupedBackground
  static let expoSystemGray4: Color = _systemGray4
  static let expoSystemGray5: Color = _systemGray5
  static let expoSystemGray6: Color = _systemGray6
}
