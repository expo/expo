//  Copyright © 2023 650 Industries. All rights reserved.

import Foundation

internal enum UpdatesStateValue: String {
  case idle
  case checking
  case downloading
  case restarting
}

internal enum UpdatesStateEventType: String {
  case check
  case checkCompleteUnavailable
  case checkCompleteAvailable
  case checkError
  case download
  case downloadComplete
  case downloadError
  case restart
}

internal struct UpdatesStateEvent {
  var type: UpdatesStateEventType
  var body: [String: Any] = [:]
  var error: Error?
  var legacyType: String?

  internal func updateId() -> String? {
    guard let manifest = self.body["manifest"] as? [String: Any],
      let updateId = manifest["id"] as? String else {
      return nil
    }
    return updateId
  }
}

internal struct UpdatesStateContext {
  var isUpdateAvailable: Bool = false
  var isUpdatePending: Bool = false
  var isChecking: Bool = false
  var isDownloading: Bool = false
  var isRestarting: Bool = false
  var latestUpdateId: String?
  var downloadedUpdateId: String?
  var checkError: Error?
  var downloadError: Error?
}

let updatesStateAllowedEvents: [UpdatesStateValue: [UpdatesStateEventType]] = [
  .idle: [.check, .download, .restart],
  .checking: [.checkCompleteAvailable, .checkCompleteUnavailable, .checkError],
  .downloading: [.downloadComplete, .downloadError],
  .restarting: []
]

let updatesStateTransitions: [UpdatesStateEventType: UpdatesStateValue] = [
  .check: .checking,
  .checkCompleteAvailable: .idle,
  .checkCompleteUnavailable: .idle,
  .checkError: .idle,
  .download: .downloading,
  .downloadComplete: .idle,
  .downloadError: .idle,
  .restart: .restarting
]

internal class UpdatesStateMachine {
  internal var appController: AppController?
  private let logger = UpdatesLogger()

  internal var state: UpdatesStateValue = .idle
  internal var context: UpdatesStateContext = UpdatesStateContext()

  internal func reset() {
    state = .idle
    context = UpdatesStateContext()
    logger.info(message: "Updates state is reset, state = \(state), context = \(context)")
  }

  internal func processEvent(_ event: UpdatesStateEvent) {
    // Execute state transition
    state = transition(state, event)

    // Mutate context
    context = mutateContext(context, event)

    logger.info(message: "Updates state change: state = \(state), event = \(event.type), context = \(context)")
  }

  internal func transition(_ state: UpdatesStateValue, _ event: UpdatesStateEvent) -> UpdatesStateValue {
    let allowedEvents: [UpdatesStateEventType] = updatesStateAllowedEvents[state] ?? []
    if !allowedEvents.contains(event.type) {
      assertionFailure("UpdatesState: invalid transition requested: state = \(state), event = \(event.type)")
    }
    return updatesStateTransitions[event.type] ?? .idle
  }

  internal func mutateContext(_ context: UpdatesStateContext, _ event: UpdatesStateEvent) -> UpdatesStateContext {
    var newContext = context
    switch event.type {
    case .check:
      newContext.isChecking = true
    case .checkCompleteUnavailable:
      newContext.isChecking = false
      newContext.checkError = nil
      newContext.latestUpdateId = nil
      newContext.isUpdateAvailable = false
    case .checkCompleteAvailable:
      newContext.isChecking = false
      newContext.checkError = nil
      newContext.latestUpdateId = event.updateId() ?? context.latestUpdateId
      newContext.isUpdateAvailable = true
    case .checkError:
      newContext.isChecking = false
      newContext.checkError = event.error
    case .download:
      newContext.isDownloading = true
    case .downloadComplete:
      newContext.isDownloading = false
      newContext.downloadError = nil
      newContext.downloadedUpdateId = event.updateId() ?? context.downloadedUpdateId
      newContext.isUpdatePending = newContext.downloadedUpdateId != nil
    case .downloadError:
      newContext.isDownloading = false
      newContext.downloadError = event.error
    case .restart:
      newContext.isRestarting = true
    }
    return newContext
  }
}
