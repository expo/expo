// Copyright 2015-present 650 Industries. All rights reserved.

import SwiftUI

/**
 An abstract view supports both UIKit and SwiftUI.
 */
public enum AppleView {
  case uikit(UIView)
  case swiftui(any ExpoSwiftUI.View)

  static func from(_ view: UIView?) -> AppleView? {
    guard let view else {
      return nil
    }
    return .uikit(view)
  }

  static func from(_ view: (any ExpoSwiftUI.View)?) -> AppleView? {
    guard let view else {
      return nil
    }
    return .swiftui(view)
  }

  func toUIView() throws -> UIView {
    switch self {
    case .uikit(let view):
      return view
    case .swiftui:
      throw AppleViewConversionError.cannotConvertSwiftUIViewToUIView
    }
  }

  func toSwiftUIView() throws -> any ExpoSwiftUI.View {
    switch self {
    case .uikit:
      throw AppleViewConversionError.cannotConvertUIKitViewToSwiftUIView
    case .swiftui(let swiftUIView):
      return swiftUIView
    }
  }
}

public enum AppleViewConversionError: Error {
  case cannotConvertSwiftUIViewToUIView
  case cannotConvertUIKitViewToSwiftUIView
}
