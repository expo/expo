// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SubmitLabelType: String, UIEnum {
  case continueLabel = "continue"
  case done = "done"
  case go = "go"
  case join = "join"
  case next = "next"
  case `return` = "return"
  case route = "route"
  case search = "search"
  case send = "send"

  var toSubmitLabel: SubmitLabel {
    switch self {
    case .return: return .`return`
    case .done: return .done
    case .go: return .go
    case .send: return .send
    case .join: return .join
    case .route: return .route
    case .search: return .search
    case .next: return .next
    case .continueLabel: return .continue
    }
  }
}

@MainActor @AnyViewBuilder
internal func submitLabelModifier(_ content: StableContent, _ p: ModifierParams) throws -> AnyView {
  let submitLabel: SubmitLabelType? = try p.value("submitLabel", nil)
  if let submitLabel {
    content.submitLabel(submitLabel.toSubmitLabel)
  } else {
    content
  }
}
