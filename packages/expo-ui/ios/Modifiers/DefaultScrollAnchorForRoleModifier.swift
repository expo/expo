// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ScrollAnchorRoleOptions: String, Enumerable {
  case initialOffset
  case sizeChanges
  case alignment

  @available(iOS 18.0, tvOS 18.0, macOS 15.0, *)
  var toScrollAnchorRole: ScrollAnchorRole {
    switch self {
    case .initialOffset: return .initialOffset
    case .sizeChanges: return .sizeChanges
    case .alignment: return .alignment
    }
  }
}

internal struct DefaultScrollAnchorForRoleModifier: ViewModifier, Record {
  @Field var anchor: UnitPointOptions?
  @Field var role: ScrollAnchorRoleOptions = .initialOffset

  func body(content: Content) -> some View {
    if #available(iOS 18.0, tvOS 18.0, macOS 15.0, *) {
      content.defaultScrollAnchor(anchor?.toUnitPoint, for: role.toScrollAnchorRole)
    } else {
      content
    }
  }
}
