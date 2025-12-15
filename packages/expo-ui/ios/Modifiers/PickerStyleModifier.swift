// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum PickerStyleType: String, Enumerable {
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
      if #available(iOS 16.0, tvOS 16.0, *) {
        content.pickerStyle(.navigationLink)
      } else {
        content.pickerStyle(.automatic)
      }
    case .palette:
#if !os(tvOS)
      if #available(iOS 17.0, *) {
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
#if !os(tvOS)
      content.pickerStyle(.wheel)
#else
      content.pickerStyle(.automatic)
#endif
    default:
      content.pickerStyle(.automatic)
    }
  }
}

internal struct PickerStyleModifier: ViewModifier, Record {
  @Field var style: PickerStyleType?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let style = style {
      style.apply(to: content)
    } else {
      content
    }
  }
}
