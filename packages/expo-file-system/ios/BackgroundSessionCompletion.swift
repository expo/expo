// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

// Accessed only on the main queue by FileSystemBackgroundSessionHandler.
final class BackgroundSessionCompletion {
  private struct Session {
    let token: UUID
    var completions: [() -> Void]
    var finishedEvents = false
    var deadlineReached = false
    var awaitingAcknowledgment: Set<ObjectIdentifier> = []
  }

  private var sessions: [String: Session] = [:]
  private var downloads: [ObjectIdentifier: String] = [:]

  func register(_ task: AnyObject, session identifier: String) {
    discard(task)
    downloads[ObjectIdentifier(task)] = identifier
  }

  func finish(_ task: AnyObject, succeeded: Bool) {
    let key = ObjectIdentifier(task)
    guard let identifier = downloads[key] else { return }
    // Foreground completions have no system handler to defer. Do not retain them for a later wake.
    guard succeeded, sessions[identifier] != nil else {
      discard(task)
      return
    }
    sessions[identifier]?.awaitingAcknowledgment.insert(key)
    completeIfReady(identifier)
  }

  func discard(_ task: AnyObject) {
    let key = ObjectIdentifier(task)
    guard let identifier = downloads.removeValue(forKey: key) else { return }
    sessions[identifier]?.awaitingAcknowledgment.remove(key)
    completeIfReady(identifier)
  }

  @discardableResult
  func receiveHandler(_ identifier: String, completion: @escaping () -> Void) -> UUID {
    if let token = sessions[identifier]?.token {
      // Keep pending processing and the original deadline, but wait for the new handler's final event.
      sessions[identifier]?.completions.append(completion)
      sessions[identifier]?.finishedEvents = false
      return token
    }
    let token = UUID()
    sessions[identifier] = Session(token: token, completions: [completion])
    return token
  }

  func finishEvents(_ identifier: String) {
    sessions[identifier]?.finishedEvents = true
    completeIfReady(identifier)
  }

  func expire(_ identifier: String, token: UUID) {
    guard sessions[identifier]?.token == token else { return }
    sessions[identifier]?.deadlineReached = true
    completeIfReady(identifier)
  }

  private func completeIfReady(_ identifier: String) {
    guard let session = sessions[identifier], session.finishedEvents,
      session.deadlineReached || session.awaitingAcknowledgment.isEmpty else { return }
    sessions.removeValue(forKey: identifier)
    for key in session.awaitingAcknowledgment {
      downloads.removeValue(forKey: key)
    }
    for completion in session.completions {
      completion()
    }
  }
}
