//  Copyright © 2023 650 Industries. All rights reserved.

import Foundation

/**
 All the possible states the machine can take.
 */
internal enum UpdatesStateValue: String {
  case idle
  case checking
  case downloading
  case restarting
}

/**
 All the possible types of events that can be sent to the machine. Each event
 will cause the machine to transition to a new state.
 */
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

/**
 For a particular machine state, only certain events may be processed.
 If the machine receives an unexpected event, an assertion failure will occur
 and the app will crash.
 */
let updatesStateAllowedEvents: [UpdatesStateValue: [UpdatesStateEventType]] = [
  .idle: [.check, .download, .restart],
  .checking: [.checkCompleteAvailable, .checkCompleteUnavailable, .checkError],
  .downloading: [.downloadComplete, .downloadError],
  .restarting: []
]

/**
 For this state machine, each event has only one destination state that the
 machine will transition to.
 */
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

/**
 Structure representing an event that can be sent to the machine.
 Convenience getters are provided to get derived properties that will be
 used to modify the context when the machine processes an event.
 */
internal struct UpdatesStateEvent {
  var type: UpdatesStateEventType
  var body: [String: Any] = [:]
  var manifest: [String: Any]? {
    guard let manifest = self.body["manifest"] as? [String: Any] else {
      return nil
    }
    return manifest
  }
  var error: Error? {
    guard let message = self.body["message"] as? String else {
      return nil
    }
    return UpdatesStateException(message)
  }
  var isRollback: Bool {
    guard let isRollback = self.body["isRollBackToEmbedded"] as? Bool else {
      return false
    }
    return isRollback
  }
}

/**
 The state machine context, with information that will be readable from JS.
 */
internal struct UpdatesStateContext {
  var isUpdateAvailable: Bool = false
  var isUpdatePending: Bool = false
  var isRollback: Bool = false
  var isChecking: Bool = false
  var isDownloading: Bool = false
  var isRestarting: Bool = false
  var latestManifest: [String: Any]?
  var downloadedManifest: [String: Any]?
  var checkError: Error?
  var downloadError: Error?
}

/**
 The state machine representing the current state of expo-updates while the app is
 running.
 */
internal class UpdatesStateMachine {
  private let logger = UpdatesLogger()

  /**
   The current state
   */
  internal var state: UpdatesStateValue = .idle
  /**
   The context
   */
  internal var context: UpdatesStateContext = UpdatesStateContext()

  /**
   Called after the app restarts (reloadAsync()) to reset the machine to its
   starting state.
   */
  internal func reset() {
    state = .idle
    context = UpdatesStateContext()
    logger.info(message: "Updates state is reset, state = \(state), context = \(context)")
  }

  /**
   Called by AppLoaderTask delegate methods in AppController during the initial
   background check for updates, and called by checkForUpdateAsync(), fetchUpdateAsync(), and reloadAsync().
   */
  internal func processEvent(_ event: UpdatesStateEvent) {
    // Execute state transition
    state = transition(state, event)

    // Mutate context
    context = mutateContext(context, event)

    logger.info(message: "Updates state change: state = \(state), event = \(event.type), context = \(context)")
  }

  /**
   Make sure the state transition is allowed, and then update the state.
   */
  internal func transition(_ state: UpdatesStateValue, _ event: UpdatesStateEvent) -> UpdatesStateValue {
    let allowedEvents: [UpdatesStateEventType] = updatesStateAllowedEvents[state] ?? []
    if !allowedEvents.contains(event.type) {
      assertionFailure("UpdatesState: invalid transition requested: state = \(state), event = \(event.type)")
    }
    return updatesStateTransitions[event.type] ?? .idle
  }

  /**
   Modify the context based on the current context and the data in the event.
   */
  internal func mutateContext(_ context: UpdatesStateContext, _ event: UpdatesStateEvent) -> UpdatesStateContext {
    var newContext = context
    switch event.type {
    case .check:
      newContext.isChecking = true
    case .checkCompleteUnavailable:
      newContext.isChecking = false
      newContext.checkError = nil
      newContext.latestManifest = nil
      newContext.isUpdateAvailable = false
      newContext.isRollback = false
    case .checkCompleteAvailable:
      newContext.isChecking = false
      newContext.checkError = nil
      newContext.latestManifest = event.manifest
      newContext.isRollback = event.isRollback
      newContext.isUpdateAvailable = true
    case .checkError:
      newContext.isChecking = false
      newContext.checkError = event.error
    case .download:
      newContext.isDownloading = true
    case .downloadComplete:
      newContext.isDownloading = false
      newContext.downloadError = nil
      newContext.downloadedManifest = event.manifest ?? context.downloadedManifest
      newContext.isUpdatePending = newContext.downloadedManifest != nil
      newContext.isUpdateAvailable = event.manifest != nil || newContext.isUpdateAvailable
    case .downloadError:
      newContext.isDownloading = false
      newContext.downloadError = event.error
    case .restart:
      newContext.isRestarting = true
    }
    return newContext
  }
}
