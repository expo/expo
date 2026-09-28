// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum ActorType: String, Codable {
  case user
  case partner
}

struct StoredSession: Codable, Equatable, Identifiable {
  let id: String
  var userId: String?
  var username: String?
  var displayName: String?
  var avatarUrl: String?
  var actorType: ActorType
  var sessionSecret: String
  var expiresAt: Date?
  var selectedAccountId: String?
  var accounts: [Account]

  var isExpired: Bool {
    guard let expiresAt else {
      return false
    }
    return Date() >= expiresAt
  }
}

extension StoredSession {
  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    id = try container.decode(String.self, forKey: .id)
    userId = try container.decodeIfPresent(String.self, forKey: .userId)
    username = try container.decodeIfPresent(String.self, forKey: .username)
    displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
    avatarUrl = try container.decodeIfPresent(String.self, forKey: .avatarUrl)
    actorType = try container.decode(ActorType.self, forKey: .actorType)
    sessionSecret = try container.decode(String.self, forKey: .sessionSecret)
    expiresAt = try container.decodeIfPresent(Date.self, forKey: .expiresAt)
    selectedAccountId = try container.decodeIfPresent(String.self, forKey: .selectedAccountId)
    accounts = (try? container.decode([Account].self, forKey: .accounts)) ?? []
  }
}

final class SessionStore: @unchecked Sendable {
  static let shared: SessionStore = {
    let store = SessionStore(keychain: KeychainItem(key: "host.exp.exponent.sessions", service: "app"))
    SessionMigration.migrateIfNeeded(
      into: store,
      legacyKeychain: KeychainItem(key: "host.exp.exponent.session", service: "app"),
      defaults: .standard
    )
    return store
  }()

  private struct State: Codable {
    var sessions: [StoredSession] = []
    var activeSessionId: String?
  }

  private let keychain: KeychainStoring
  private let lock = NSLock()
  private var state: State

  init(keychain: KeychainStoring) {
    self.keychain = keychain
    self.state = keychain.read().flatMap { try? JSONDecoder().decode(State.self, from: $0) } ?? State()
  }

  var sessions: [StoredSession] {
    lock.withLock { state.sessions }
  }

  var activeSession: StoredSession? {
    lock.withLock { state.sessions.first { $0.id == state.activeSessionId } }
  }

  var activeLiveSession: StoredSession? {
    guard let session = activeSession, !session.isExpired else {
      return nil
    }
    return session
  }

  @discardableResult
  func add(
    sessionSecret: String,
    expiresAt: Date? = nil,
    username: String? = nil,
    selectedAccountId: String? = nil
  ) -> StoredSession {
    let session = StoredSession(
      id: UUID().uuidString,
      userId: nil,
      username: username,
      displayName: nil,
      avatarUrl: nil,
      actorType: .user,
      sessionSecret: sessionSecret,
      expiresAt: expiresAt,
      selectedAccountId: selectedAccountId,
      accounts: []
    )
    mutate { state in
      state.sessions.append(session)
      state.activeSessionId = session.id
    }
    return session
  }

  func activate(id: String) {
    mutate { state in
      guard state.sessions.contains(where: { $0.id == id }) else {
        return
      }
      state.activeSessionId = id
    }
  }

  func remove(id: String) {
    mutate { state in
      state.sessions.removeAll { $0.id == id }
      if state.activeSessionId == id {
        state.activeSessionId = Self.fallbackId(in: state.sessions)
      }
    }
  }

  func deactivateExpiredActiveSession() {
    mutate { state in
      guard let active = state.sessions.first(where: { $0.id == state.activeSessionId }), active.isExpired else {
        return
      }
      state.activeSessionId = Self.fallbackId(in: state.sessions)
    }
  }

  func fallBackFromExpiredActiveSession() {
    mutate { state in
      guard let active = state.sessions.first(where: { $0.id == state.activeSessionId }),
            active.isExpired,
            let fallbackId = Self.fallbackId(in: state.sessions) else {
        return
      }
      state.activeSessionId = fallbackId
    }
  }

  func updateProfile(id: String, from actor: UserActor) {
    mutate { state in
      guard let index = state.sessions.firstIndex(where: { $0.id == id }) else {
        return
      }
      var session = state.sessions[index]
      session.userId = actor.id
      session.username = actor.username
      session.displayName = actor.fullName ?? actor.firstName ?? actor.username
      session.avatarUrl = actor.primaryAccountProfileImageUrl
      session.actorType = actor.typename == "PartnerActor" ? .partner : .user
      session.accounts = actor.accounts
      if !actor.accounts.contains(where: { $0.id == session.selectedAccountId }) {
        session.selectedAccountId = actor.accounts.first?.id
      }
      state.sessions[index] = session
      state.sessions.removeAll { $0.id != id && $0.userId == actor.id }
    }
  }

  func selectAccount(_ accountId: String, forSession id: String) {
    mutate { state in
      guard let index = state.sessions.firstIndex(where: { $0.id == id }) else {
        return
      }
      state.sessions[index].selectedAccountId = accountId
    }
  }

  func removeAll() {
    mutate { state in
      state = State()
    }
  }

  private static func fallbackId(in sessions: [StoredSession]) -> String? {
    sessions.first { !$0.isExpired }?.id
  }

  private func mutate(_ change: (inout State) -> Void) {
    lock.withLock {
      change(&state)
      persist(state)
    }
  }

  private func persist(_ state: State) {
    guard !state.sessions.isEmpty else {
      keychain.delete()
      return
    }
    do {
      try keychain.write(JSONEncoder().encode(state))
    } catch {
      print("[SessionStore] Failed to save sessions: \(error)")
    }
  }
}
