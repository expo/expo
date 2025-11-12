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
      content.pickerStyle(.menu)
    case .navigationLink:
      if #available(iOS 16.0, *) {
        content.pickerStyle(.navigationLink)
      } else {
        content.pickerStyle(.automatic)
      }
    case .palette:
      if #available(iOS 17.0, *) {
        content.pickerStyle(.palette)
      } else {
        content.pickerStyle(.automatic)
      }
    case .segmented:
      content.pickerStyle(.segmented)
    case .wheel:
      content.pickerStyle(.wheel)
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
      content.pickerStyle(.automatic)
    }
  }
}
