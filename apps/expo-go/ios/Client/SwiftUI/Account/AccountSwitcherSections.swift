// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

struct AccountSwitcherRowModel: Identifiable {
  let sessionId: String
  let account: Account
  let isSelected: Bool

  var id: String { "\(sessionId)/\(account.id)" }
}

struct AccountSwitcherSection: Identifiable {
  let sessionId: String
  let username: String
  let isActive: Bool
  let isPartner: Bool
  let isExpired: Bool
  let rows: [AccountSwitcherRowModel]

  var id: String { sessionId }
}

enum AccountSwitcherSections {
  static func make(sessions: [StoredSession], activeSessionId: String?) -> [AccountSwitcherSection] {
    let active: [StoredSession] = sessions.filter { $0.id == activeSessionId }
    let others: [StoredSession] = sessions.filter { $0.id != activeSessionId }
    return (active + others).map { session in
      let isActive = session.id == activeSessionId
      let isPersonal: (Account) -> Bool = { session.userId != nil && $0.ownerUserActor?.id == session.userId }
      let accounts = session.accounts.filter(isPersonal) + session.accounts.filter { !isPersonal($0) }
      return AccountSwitcherSection(
        sessionId: session.id,
        username: session.username ?? session.displayName ?? "",
        isActive: isActive,
        isPartner: session.actorType == .partner,
        isExpired: session.isExpired,
        rows: session.isExpired ? [] : accounts.map {
          AccountSwitcherRowModel(sessionId: session.id, account: $0, isSelected: isActive && $0.id == session.selectedAccountId)
        }
      )
    }
  }
}
