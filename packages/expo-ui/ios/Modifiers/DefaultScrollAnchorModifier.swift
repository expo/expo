// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal struct DefaultScrollAnchorModifier: ViewModifier, Record {
  @Field var anchor: UnitPointOptions?

  func body(content: Content) -> some View {
    if #available(iOS 17.0, tvOS 17.0, macOS 14.0, *) {
      content.defaultScrollAnchor(anchor?.toUnitPoint)
    } else {
      content
    }
  }
}
