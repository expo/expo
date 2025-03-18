// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI
import ExpoModulesCore

final class SwiftUITextProps: ExpoSwiftUI.ViewProps {
  @Field var text: String = ""
  @Field var weight: String?
  @Field var design: String?
  @Field var size: Double?
  @Field var lineLimit: Int?
}

struct SwiftUIText: ExpoSwiftUI.View {
  @ObservedObject var props: SwiftUITextProps

  private func getFontWeight() -> Font.Weight {
    switch props.weight {
    case "ultraLight": return .ultraLight
    case "thin": return .thin
    case "light": return .light
    case "regular": return .regular
    case "medium": return .medium
    case "semibold": return .semibold
    case "bold": return .bold
    case "heavy": return .heavy
    case "black": return .black
    default: return .regular
    }
  }

  private func getFontDesign() -> Font.Design {
    switch props.design {
    case "rounded": return .rounded
    case "serif": return .serif
    case "monospaced": return .monospaced
    default: return .default
    }
  }

  var body: some View {
    Text(props.text)
      .font(.system(
        size: CGFloat(props.size ?? 17),
        weight: getFontWeight(),
        design: getFontDesign()
      ))
      .lineLimit(props.lineLimit)
  }
}
