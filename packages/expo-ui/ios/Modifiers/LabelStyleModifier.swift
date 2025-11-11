import ExpoModulesCore
import SwiftUI

internal enum LabelStyleType: String, Enumerable {
  case titleOnly
  case titleAndIcon
  case iconOnly
}

internal struct LabelStyleModifier: ViewModifier, Record {
  @Field var style: LabelStyleType = .titleOnly

  func body(content: Content) -> some View {
    switch style {
    case .titleOnly:
      content.labelStyle(.titleOnly)
    case .titleAndIcon:
      content.labelStyle(.titleAndIcon)
    case .iconOnly:
      content.labelStyle(.iconOnly)
    }
  }
}