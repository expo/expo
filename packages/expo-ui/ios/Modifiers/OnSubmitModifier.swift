// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct OnSubmitModifier: EventDispatchingViewModifier, Record {
  var eventDispatcher: EventDispatcher?

  init() {}

  func body(content: Content) -> some View {
    content.onSubmit {
      eventDispatcher?(["onSubmit": [:]])
    }
  }
}
