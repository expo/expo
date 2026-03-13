// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI

internal enum SubmitLabelType: String, Enumerable {
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

internal struct SubmitLabelModifier: ViewModifier, Record {
  @Field var submitLabel: SubmitLabelType?

  @ViewBuilder
  func body(content: Content) -> some View {
    if let submitLabel {
      content.submitLabel(submitLabel.toSubmitLabel)
    } else {
      content
    }
  }
}
