// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

extension Color {
  static let expoBlue = Color(red: 0.0, green: 0.46, blue: 1.0)

  static let expoSecondaryText = Color(.secondaryLabel)

  static let expoSystemBackground = Color(uiColor: .systemBackground)
  static let expoSecondarySystemBackground = Color(uiColor: .secondarySystemBackground)
  static let expoSecondarySystemGroupedBackground = Color(uiColor: .secondarySystemGroupedBackground)

  static let expoSystemGray4 = Color(uiColor: .systemGray4)
  static let expoSystemGray5 = Color(uiColor: .systemGray5)
  static let expoSystemGray6 = Color(uiColor: .systemGray6)
}

extension Font {
  static func expoCaption(_ size: CGFloat = 12) -> Font {
    return .system(size: size, weight: .medium, design: .default)
  }
}

struct BorderRadius {
  static let small: CGFloat = 4
  static let medium: CGFloat = 8
  static let large: CGFloat = 12
}

struct ExpoSectionHeaderStyle: ViewModifier {
  func body(content: Content) -> some View {
    content
      .font(.expoCaption())
      .foregroundColor(.expoSecondaryText)
      .textCase(.uppercase)
  }
}

extension View {
  func expoSectionHeader() -> some View {
    self.modifier(ExpoSectionHeaderStyle())
  }
}

struct ErrorBanner: View {
  let message: String

  var body: some View {
    HStack(spacing: 10) {
      Image(systemName: "exclamationmark.circle.fill")
        .font(.body)
      Text(message)
        .font(.callout)
    }
    .foregroundColor(.red)
    .padding(12)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(Color.red.opacity(0.08))
    .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
  }
}
