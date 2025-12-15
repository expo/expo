// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum PresentationCompactAdaptationType: String, Enumerable {
  case automatic
  case none
  case popover
  case sheet
  case fullScreenCover
}

internal struct PresentationCompactAdaptationModifier: ViewModifier, Record {
  @Field var adaptation: PresentationCompactAdaptationType?
  @Field var horizontal: PresentationCompactAdaptationType?
  @Field var vertical: PresentationCompactAdaptationType?

  func body(content: Content) -> some View {
    if #available(iOS 16.4, tvOS 16.4, *) {
      if let horizontal, let vertical {
        content.presentationCompactAdaptation(horizontal: horizontal.toPresentationAdaptation(), vertical: vertical.toPresentationAdaptation())
      } else if let adaptation {
        content.presentationCompactAdaptation(adaptation.toPresentationAdaptation())
      } else {
        content
      }
    } else {
      content
    }
  }
}

@available(iOS 16.4, tvOS 16.4, *)
extension PresentationCompactAdaptationType {
  func toPresentationAdaptation() -> PresentationAdaptation {
    switch self {
    case .none:
      return .none
    case .popover:
      return .popover
    case .sheet:
      return .sheet
    case .fullScreenCover:
      return .fullScreenCover
    case .automatic:
      return .automatic
    }
  }
}
