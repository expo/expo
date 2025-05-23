// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal extension View {
  @ViewBuilder
  func applyOnTapGesture(useTapGesture: Bool?, eventDispatcher: EventDispatcher, useContentShape: Bool = false) -> some View {
    if useTapGesture == true {
      if #available(iOS 13.0, macOS 10.13, tvOS 16.0, *) {
        self
          .if(useContentShape) {
            $0.contentShape(Rectangle())
          }
          .onTapGesture {
            eventDispatcher()
          }
      }
    } else {
      self
    }
  }
}
