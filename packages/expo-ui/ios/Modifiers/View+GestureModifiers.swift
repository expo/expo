// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal extension View {
  @ViewBuilder
  func applyOnTapGesture(useTapGesture: Bool?, eventDispatcher: EventDispatcher, useContentShape: Bool = false) -> some View {
    if useTapGesture == true {
      self
        .if(useContentShape) {
          $0.contentShape(Rectangle())
        }
        .onTapGesture {
          eventDispatcher()
        }
    } else {
      self
    }
  }
}
