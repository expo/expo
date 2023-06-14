//  Copyright © 2023 650 Industries. All rights reserved.

import Foundation

/**
 Protocol with a method for sending state change events to JS.
 In production, this will be implemented by the AppController.sharedInstance.
 */
internal protocol UpdatesStateChangeEventSender {
  func sendUpdateStateChangeEventToBridge(_ eventType: UpdatesStateEventType, body: [String: Any])
}

// MARK: - Enums

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

// MARK: - Data structures

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
  var changedProperties: [String] {
    return UpdatesStateEvent.updatesStateEventChangedProperties[type] ?? UpdatesStateContext.allProps
  }

  /**
   For each event type, an array with the names of the context properties that change
   when that event is processed.
   */
  static let updatesStateEventChangedProperties: [UpdatesStateEventType: [String]] = [
    .check: ["isChecking"],
    .checkCompleteAvailable: ["isChecking", "isUpdateAvailable", "checkError", "latestManifest", "isRollback"],
    .checkCompleteUnavailable: ["isChecking", "isUpdateAvailable", "checkError", "latestManifest", "isRollback"],
    .checkError: ["isChecking", "checkError"],
    .download: ["isDownloading"],
    .downloadComplete: ["isDownloading", "downloadError", "latestManifest", "downloadedManifest", "isUpdatePending", "isUpdateAvailable"],
    .downloadError: ["isDownloading", "downloadError"],
    .restart: ["isRestarting"]
  ]
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

  var json: [String: Any] {
    return [
      "isUpdateAvailable": self.isUpdateAvailable,
      "isUpdatePending": self.isUpdatePending,
      "isRollback": self.isRollback,
      "isChecking": self.isChecking,
      "isDownloading": self.isDownloading,
      "isRestarting": self.isRestarting,
      "latestManifest": self.latestManifest ?? NSNull(),
      "downloadedManifest": self.latestManifest ?? NSNull(),
      "checkError": self.checkError ?? NSNull(),
      "downloadError": self.downloadError ?? NSNull()
    ] as [String: Any]
  }

  func partialJsonWithKeys(keys: [String]?) -> [String: Any] {
    guard let keys = keys else {
      return self.json
    }
    var json: [String: Any] = [:]
    let fullJson = self.json
    for key in keys {
      json[key] = fullJson[key]
    }
    return json
  }

  static let allProps: [String] = [
    "isUpdateAvailable",
    "isUpdatePending",
    "isRollback",
    "isChecking",
    "isDownloading",
    "isRestarting",
    "latestManifest",
    "downloadedManifest",
    "checkError",
    "downloadError"
  ]
}

// MARK: - State machine class

/**
 The Updates state machine class. There should be only one instance of this class
 in a production app, instantiated as a property of AppController.
 */
internal class UpdatesStateMachine {
  private let logger = UpdatesLogger()

  // MARK: - Public methods and properties

  /**
   In production, this is the AppController instance.
   */
  internal var changeEventSender: (any UpdatesStateChangeEventSender)?

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
    sendChangeEventToJS()
  }

  /**
   Called by AppLoaderTask delegate methods in AppController during the initial
   background check for updates, and called by checkForUpdateAsync(), fetchUpdateAsync(), and reloadAsync().
   */
  internal func processEvent(_ event: UpdatesStateEvent) {
    // Execute state transition
    if transition(event) {
      // Only change context if transition succeeds
      context = reducedContext(context, event)
      logger.info(message: "Updates state change: state = \(state), event = \(event.type), context = \(context)")
      // Send change event
      sendChangeEventToJS(event)
    }
  }

  // MARK: - Private nethods

  /**
   Make sure the state transition is allowed, and then update the state.
   */
  private func transition(_ event: UpdatesStateEvent) -> Bool {
    let allowedEvents: [UpdatesStateEventType] = UpdatesStateMachine.updatesStateAllowedEvents[state] ?? []
    if !allowedEvents.contains(event.type) {
      // Uncomment the line below to halt execution on invalid state transitions,
      // very useful for testing
      /*
      assertionFailure("UpdatesState: invalid transition requested: state = \(state), event = \(event.type)")
       */
      return false
    }
    // Successful transition
    state = UpdatesStateMachine.updatesStateTransitions[event.type] ?? .idle
    return true
  }

  /**
   Given an allowed event and a context, return a new context with the changes
   made by processing the event.
   */
  private func reducedContext(_ context: UpdatesStateContext, _ event: UpdatesStateEvent) -> UpdatesStateContext {
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
      newContext.latestManifest = event.manifest ?? context.latestManifest
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

  /**
   If a state change event is passed in, the JS sender
   is called with just the fields and values that changed.
   During a reset, this method is called with no event passed in,
   and then all the fields and the entire context are passed to the JS sender.
   */
  private func sendChangeEventToJS(_ event: UpdatesStateEvent? = nil) {
    guard let event: UpdatesStateEvent = event else {
      changeEventSender?.sendUpdateStateChangeEventToBridge(.restart, body: [
        "fields": UpdatesStateContext.allProps,
        "values": context.json
      ])
      return
    }
    changeEventSender?.sendUpdateStateChangeEventToBridge(event.type, body: [
      "fields": event.changedProperties,
      "values": context.partialJsonWithKeys(keys: event.changedProperties)
    ])
  }

  // MARK: - Static definitions of the state machine rules

  /**
   For a particular machine state, only certain events may be processed.
   If the machine receives an unexpected event, an assertion failure will occur
   and the app will crash.
   */
  static let updatesStateAllowedEvents: [UpdatesStateValue: [UpdatesStateEventType]] = [
    .idle: [.check, .download, .restart],
    .checking: [.checkCompleteAvailable, .checkCompleteUnavailable, .checkError],
    .downloading: [.downloadComplete, .downloadError],
    .restarting: []
  ]

  /**
   For this state machine, each event has only one destination state that the
   machine will transition to.
   */
  static let updatesStateTransitions: [UpdatesStateEventType: UpdatesStateValue] = [
    .check: .checking,
    .checkCompleteAvailable: .idle,
    .checkCompleteUnavailable: .idle,
    .checkError: .idle,
    .download: .downloading,
    .downloadComplete: .idle,
    .downloadError: .idle,
    .restart: .restarting
  ]
}
