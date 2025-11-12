// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct TagModifier: ViewModifier, Record {
  @Field var tag: String?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let tag = tag {
      content.tag(tag)
    } else {
      content
    }
  }
}
