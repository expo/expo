// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum PickerStyleType: String, UIEnum {
  case automatic
  case inline
  case menu
  case navigationLink
  case palette
  case segmented
  case wheel

  @ViewBuilder
  func apply<Content: View>(to content: Content) -> some View {
    switch self {
    case .inline:
      content.pickerStyle(.inline)
    case .menu:
      if #available(iOS 14.0, tvOS 17.0, *) {
        content.pickerStyle(.menu)
      } else {
        content.pickerStyle(.automatic)
      }
    case .navigationLink:
#if os(macOS)
      content.pickerStyle(.automatic)
#else
      if #available(iOS 16.0, tvOS 16.0, *) {
        content.pickerStyle(.navigationLink)
      } else {
        content.pickerStyle(.automatic)
      }
#endif
    case .palette:
#if !os(tvOS)
      if #available(iOS 17.0, macOS 14.0, *) {
        content.pickerStyle(.palette)
      } else {
        content.pickerStyle(.automatic)
      }
#else
      content.pickerStyle(.automatic)
#endif
    case .segmented:
      content.pickerStyle(.segmented)
    case .wheel:
#if !os(tvOS) && !os(macOS)
      content.pickerStyle(.wheel)
#else
      content.pickerStyle(.automatic)
#endif
    default:
      content.pickerStyle(.automatic)
    }
  }
}

@MainActor @AnyViewBuilder
internal func pickerStyleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let style: PickerStyleType? = try p.value("style", nil)
  if let style = style {
    style.apply(to: content)
  } else {
    content
  }
}
