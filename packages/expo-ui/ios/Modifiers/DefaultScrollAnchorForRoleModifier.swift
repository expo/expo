// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum ScrollAnchorRoleOptions: String, UIEnum {
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

@MainActor @AnyViewBuilder
internal func defaultScrollAnchorForRoleModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let anchor: UnitPointOptions? = try p.value("anchor", nil)
  let role: ScrollAnchorRoleOptions = try p.value("role", .initialOffset)
  if #available(iOS 18.0, tvOS 18.0, macOS 15.0, *) {
    content.defaultScrollAnchor(anchor?.toUnitPoint, for: role.toScrollAnchorRole)
  } else {
    content
  }
}
