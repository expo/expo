// Copyright 2026-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct IDModifier: ViewModifier, Record {
  @Field var id: String = ""

  func body(content: Content) -> some View {
    content.id(id)
  }
}
