// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

extension Color {
  static let expoBlue = Color(red: 0.0, green: 0.46, blue: 1.0)
  static let expoGreen = Color(red: 0.0, green: 0.8, blue: 0.4)
  static let expoOrange = Color(red: 1.0, green: 0.4, blue: 0.0)
  static let expoRed = Color(red: 1.0, green: 0.23, blue: 0.19)
  static let expoPink = Color(red: 1.0, green: 0.18, blue: 0.58)
  static let expoPurple = Color(red: 0.56, green: 0.27, blue: 1.0)

  static let expoPrimaryText = Color(.label)
  static let expoSecondaryText = Color(.secondaryLabel)
  static let expoTertiaryText = Color(.tertiaryLabel)

  static let expoBorder = Color(.separator)
  static let expoSecondaryBorder = Color(.opaqueSeparator)
}

extension Font {
  static func expoTitle(_ size: CGFloat = 28) -> Font {
    return .system(size: size, weight: .bold, design: .default)
  }

  static func expoHeadline(_ size: CGFloat = 17) -> Font {
    return .system(size: size, weight: .semibold, design: .default)
  }

  static func expoBody(_ size: CGFloat = 17) -> Font {
    return .system(size: size, weight: .regular, design: .default)
  }

  static func expoCaption(_ size: CGFloat = 12) -> Font {
    return .system(size: size, weight: .medium, design: .default)
  }

  static func expoFootnote(_ size: CGFloat = 13) -> Font {
    return .system(size: size, weight: .regular, design: .default)
  }
}

struct Spacing {
  static let xxs: CGFloat = 2
  static let xs: CGFloat = 4
  static let small: CGFloat = 8
  static let medium: CGFloat = 12
  static let large: CGFloat = 16
  static let xl: CGFloat = 20
  static let xxl: CGFloat = 24
  static let xxxl: CGFloat = 32
}

struct BorderRadius {
  static let small: CGFloat = 4
  static let medium: CGFloat = 8
  static let large: CGFloat = 12
  static let xl: CGFloat = 16
  static let xxl: CGFloat = 20
}

extension View {
  func expoCardShadow() -> some View {
    self.shadow(
      color: Color.black.opacity(0.08),
      radius: 8,
      x: 0,
      y: 2
    )
  }

  func expoButtonShadow() -> some View {
    self.shadow(
      color: Color.black.opacity(0.1),
      radius: 4,
      x: 0,
      y: 2
    )
  }
}

struct ExpoButtonStyle: ButtonStyle {
  let style: ExpoButtonVariant

  enum ExpoButtonVariant {
    case primary
    case secondary
    case ghost
    case danger
  }

  func makeBody(configuration: Configuration) -> some View {
    configuration.label
      .font(.expoHeadline())
      .padding(.horizontal, Spacing.large)
      .padding(.vertical, Spacing.medium)
      .background(backgroundColor)
      .foregroundColor(textColor)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.medium))
      .scaleEffect(configuration.isPressed ? 0.98 : 1.0)
      .opacity(configuration.isPressed ? 0.8 : 1.0)
      .animation(.easeInOut(duration: 0.1), value: configuration.isPressed)
  }

  private var backgroundColor: Color {
    switch style {
    case .primary:
      return .expoBlue
    case .secondary:
      return .expoSecondarySystemBackground
    case .ghost:
      return .clear
    case .danger:
      return .expoRed
    }
  }

  private var textColor: Color {
    switch style {
    case .primary, .danger:
      return .white
    case .secondary:
      return .expoPrimaryText
    case .ghost:
      return .expoBlue
    }
  }
}

struct ExpoCardStyle: ViewModifier {
  func body(content: Content) -> some View {
    content
      .background(Color.expoSecondarySystemGroupedBackground)
      .clipShape(RoundedRectangle(cornerRadius: BorderRadius.large))
      .expoCardShadow()
  }
}

extension View {
  func expoCard() -> some View {
    self.modifier(ExpoCardStyle())
  }
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

struct ExpoListRowStyle: ViewModifier {
  let isFirst: Bool
  let isLast: Bool

  init(isFirst: Bool = false, isLast: Bool = false) {
    self.isFirst = isFirst
    self.isLast = isLast
  }

  func body(content: Content) -> some View {
    content
      .padding(Spacing.large)
      .background(Color.expoSecondarySystemGroupedBackground)
      .overlay(
        Rectangle()
          .frame(height: 0.5)
          .foregroundColor(.expoBorder)
          .opacity(isFirst ? 0 : 1),
        alignment: .top
      )
      .clipShape(
        RoundedCorners(
          topLeading: isFirst ? BorderRadius.large : 0,
          topTrailing: isFirst ? BorderRadius.large : 0,
          bottomLeading: isLast ? BorderRadius.large : 0,
          bottomTrailing: isLast ? BorderRadius.large : 0
        )
      )
  }
}

extension View {
  func expoListRow(isFirst: Bool = false, isLast: Bool = false) -> some View {
    self.modifier(ExpoListRowStyle(isFirst: isFirst, isLast: isLast))
  }
}

struct RoundedCorners: Shape {
  let topLeading: CGFloat
  let topTrailing: CGFloat
  let bottomLeading: CGFloat
  let bottomTrailing: CGFloat

  func path(in rect: CGRect) -> Path {
    var path = Path()

    let width = rect.size.width
    let height = rect.size.height

    path.move(to: CGPoint(x: topLeading, y: 0))

    path.addLine(to: CGPoint(x: width - topTrailing, y: 0))
    path.addArc(center: CGPoint(x: width - topTrailing, y: topTrailing), radius: topTrailing, startAngle: Angle(degrees: -90), endAngle: Angle(degrees: 0), clockwise: false)

    path.addLine(to: CGPoint(x: width, y: height - bottomTrailing))
    path.addArc(center: CGPoint(x: width - bottomTrailing, y: height - bottomTrailing), radius: bottomTrailing, startAngle: Angle(degrees: 0), endAngle: Angle(degrees: 90), clockwise: false)

    path.addLine(to: CGPoint(x: bottomLeading, y: height))
    path.addArc(center: CGPoint(x: bottomLeading, y: height - bottomLeading), radius: bottomLeading, startAngle: Angle(degrees: 90), endAngle: Angle(degrees: 180), clockwise: false)

    path.addLine(to: CGPoint(x: 0, y: topLeading))
    path.addArc(center: CGPoint(x: topLeading, y: topLeading), radius: topLeading, startAngle: Angle(degrees: 180), endAngle: Angle(degrees: 270), clockwise: false)

    path.closeSubpath()
    return path
  }
}
