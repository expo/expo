// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
@testable import Expo_Go

final class InMemoryKeychain: KeychainStoring, @unchecked Sendable {
  var data: Data?

  func read() -> Data? { data }
  func write(_ data: Data) throws { self.data = data }
  func delete() { data = nil }
}

func makeAccount(id: String, name: String, ownerId: String?) -> Account {
  Account(
    id: id,
    name: name,
    profileImageUrl: nil,
    ownerUserActor: ownerId.map {
      UserActorSimple(id: $0, username: name, primaryAccountProfileImageUrl: nil, firstName: nil, fullName: nil, lastName: nil)
    }
  )
}

func makeActor(
  typename: String = "User",
  id: String,
  username: String,
  fullName: String? = nil,
  accounts: [Account]
) -> UserActor {
  UserActor(
    typename: typename,
    id: id,
    username: username,
    firstName: nil,
    lastName: nil,
    primaryAccountProfileImageUrl: nil,
    bestContactEmail: nil,
    accounts: accounts,
    fullName: fullName
  )
}

func makeSession(
  id: String,
  userId: String? = nil,
  username: String? = nil,
  actorType: ActorType = .user,
  expiresAt: Date? = nil,
  selectedAccountId: String? = nil,
  accounts: [Account] = []
) -> StoredSession {
  StoredSession(
    id: id,
    userId: userId,
    username: username,
    displayName: nil,
    avatarUrl: nil,
    actorType: actorType,
    sessionSecret: "secret-\(id)",
    expiresAt: expiresAt,
    selectedAccountId: selectedAccountId,
    accounts: accounts
  )
}
