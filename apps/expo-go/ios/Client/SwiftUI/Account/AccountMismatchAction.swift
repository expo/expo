// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum AccountMismatchAction: Equatable {
  case switchTo(sessionId: String)
  case signIn

  static func resolve(username: String, sessions: [StoredSession], activeSessionId: String?) -> AccountMismatchAction? {
    guard let session = sessions.first(where: { $0.username == username && !$0.isExpired }) else {
      return .signIn
    }
    return session.id == activeSessionId ? nil : .switchTo(sessionId: session.id)
  }

  func title(for username: String) -> String {
    switch self {
    case .switchTo:
      return "Switch to \(username)"
    case .signIn:
      return "Sign in as \(username)"
    }
  }
}
