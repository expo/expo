// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct IDModifier: ViewModifier, Record {
  @Field var id: String?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let id {
      content.id(AnyHashable(id))
    } else {
      content
    }
  }
}
