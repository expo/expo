//  Copyright © 2023 650 Industries. All rights reserved.

// swiftlint:disable no_grouping_extension
// swiftlint:disable type_name

import Foundation

/**
 Protocol with a method for sending state change events to JS.
 In production, this will be implemented by the AppController.sharedInstance.
 */
internal protocol UpdatesStateChangeDelegate: AnyObject {
  func sendUpdateStateChangeEventToBridge(_ eventType: UpdatesStateEventType, body: [String: Any?])
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
 Protocol representing an event that can be sent to the machine, and
 structs representing the different event types
 */
internal protocol UpdatesStateEvent {
  var type: UpdatesStateEventType { get }
  var manifest: [String: Any]? { get }
  var message: String? { get }
  var isRollback: Bool { get }
  var error: Error? { get }
}

internal struct UpdatesStateEventCheck: UpdatesStateEvent {
  let type: UpdatesStateEventType = .check
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let isRollback: Bool = false
  let error: Error? = nil
}

internal struct UpdatesStateEventDownload: UpdatesStateEvent {
  let type: UpdatesStateEventType = .download
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let isRollback: Bool = false
  let error: Error? = nil
}

internal struct UpdatesStateEventRestart: UpdatesStateEvent {
  let type: UpdatesStateEventType = .restart
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let isRollback: Bool = false
  let error: Error? = nil
}

internal struct UpdatesStateEventCheckError: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkError
  let manifest: [String: Any]? = nil
  let message: String?
  let isRollback: Bool = false
  var error: Error? {
    return (message != nil) ? UpdatesStateException(message ?? "") : nil
  }
}

internal struct UpdatesStateEventDownloadError: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadError
  let manifest: [String: Any]? = nil
  let message: String?
  let isRollback: Bool = false
  var error: Error? {
    return (message != nil) ? UpdatesStateException(message ?? "") : nil
  }
}

internal struct UpdatesStateEventCheckCompleteWithUpdate: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkCompleteAvailable
  let manifest: [String: Any]?
  let message: String? = nil
  let isRollback: Bool = false
  let error: Error? = nil
}

internal struct UpdatesStateEventCheckCompleteWithRollback: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkCompleteAvailable
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let isRollback: Bool = true
  let error: Error? = nil
}

internal struct UpdatesStateEventCheckComplete: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkCompleteUnavailable
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let isRollback: Bool = false
  let error: Error? = nil
}

internal struct UpdatesStateEventDownloadCompleteWithUpdate: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadComplete
  let manifest: [String: Any]?
  let message: String? = nil
  let isRollback: Bool = false
  let error: Error? = nil
}

internal struct UpdatesStateEventDownloadCompleteWithRollback: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadComplete
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let isRollback: Bool = true
  let error: Error? = nil
}

internal struct UpdatesStateEventDownloadComplete: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadComplete
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let isRollback: Bool = false
  let error: Error? = nil
}

/**
 The state machine context, with information that will be readable from JS.
 */
internal struct UpdatesStateContext {
  let isUpdateAvailable: Bool
  let isUpdatePending: Bool
  let isRollback: Bool
  let isChecking: Bool
  let isDownloading: Bool
  let isRestarting: Bool
  let latestManifest: [String: Any]?
  let downloadedManifest: [String: Any]?
  let checkError: Error?
  let downloadError: Error?

  var json: [String: Any?] {
    return [
      "isUpdateAvailable": self.isUpdateAvailable,
      "isUpdatePending": self.isUpdatePending,
      "isRollback": self.isRollback,
      "isChecking": self.isChecking,
      "isDownloading": self.isDownloading,
      "isRestarting": self.isRestarting,
      "latestManifest": self.latestManifest,
      "downloadedManifest": self.downloadedManifest,
      "checkError": self.checkError,
      "downloadError": self.downloadError
    ] as [String: Any?]
  }
}

extension UpdatesStateContext {
  init() {
    self.isUpdateAvailable = false
    self.isUpdatePending = false
    self.isRollback = false
    self.isChecking = false
    self.isDownloading = false
    self.isRestarting = false
    self.latestManifest = nil
    self.downloadedManifest = nil
    self.checkError = nil
    self.downloadError = nil
  }

  // struct copy, lets you overwrite specific variables retaining the value of the rest
  // using a closure to set the new values for the copy of the struct
  func copy(build: (inout Builder) -> Void) -> UpdatesStateContext {
    var builder = Builder(original: self)
    build(&builder)
    return builder.toContext()
  }

  struct Builder {
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

    fileprivate init(original: UpdatesStateContext) {
      self.isUpdateAvailable = original.isUpdateAvailable
      self.isUpdatePending = original.isUpdatePending
      self.isRollback = original.isRollback
      self.isChecking = original.isChecking
      self.isDownloading = original.isDownloading
      self.isRestarting = original.isRestarting
      self.latestManifest = original.latestManifest
      self.downloadedManifest = original.downloadedManifest
      self.checkError = original.checkError
      self.downloadError = original.downloadError
    }

    fileprivate func toContext() -> UpdatesStateContext {
      return UpdatesStateContext(
        isUpdateAvailable: isUpdateAvailable,
        isUpdatePending: isUpdatePending,
        isRollback: isRollback,
        isChecking: isChecking,
        isDownloading: isDownloading,
        isRestarting: isRestarting,
        latestManifest: latestManifest,
        downloadedManifest: downloadedManifest,
        checkError: checkError,
        downloadError: downloadError
      )
    }
  }
}

// MARK: - State machine class

/**
 The Updates state machine class. There should be only one instance of this class
 in a production app, instantiated as a property of AppController.
 */
internal class UpdatesStateMachine {
  private let logger = UpdatesLogger()

  init(changeEventDelegate: (any UpdatesStateChangeDelegate)) {
    self.changeEventDelegate = changeEventDelegate
  }

  // MARK: - Public methods and properties

  /**
   In production, this is the AppController instance.
   */
  private weak var changeEventDelegate: (any UpdatesStateChangeDelegate)?

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

  // MARK: - Private methods

  /**
   Make sure the state transition is allowed, and then update the state.
   */
  private func transition(_ event: UpdatesStateEvent) -> Bool {
    let allowedEvents: Set<UpdatesStateEventType> = UpdatesStateMachine.updatesStateAllowedEvents[state] ?? []
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
    switch event.type {
    case .check:
      return context.copy {
        $0.isChecking = true
      }
    case .checkCompleteUnavailable:
      return context.copy {
        $0.isChecking = false
        $0.checkError = nil
        $0.latestManifest = nil
        $0.isUpdateAvailable = false
        $0.isRollback = false
      }
    case .checkCompleteAvailable:
      return context.copy {
        $0.isChecking = false
        $0.checkError = nil
        $0.latestManifest = event.manifest
        $0.isRollback = event.isRollback
        $0.isUpdateAvailable = true
      }
    case .checkError:
      return context.copy {
        $0.isChecking = false
        $0.checkError = event.error
      }
    case .download:
      return context.copy {
        $0.isDownloading = true
      }
    case .downloadComplete:
      return context.copy {
        $0.isDownloading = false
        $0.downloadError = nil
        $0.latestManifest = event.manifest ?? context.latestManifest
        $0.downloadedManifest = event.manifest ?? context.downloadedManifest
        $0.isUpdatePending = $0.downloadedManifest != nil
        $0.isUpdateAvailable = event.manifest != nil || context.isUpdateAvailable
      }
    case .downloadError:
      return context.copy {
        $0.isDownloading = false
        $0.downloadError = event.error
      }
    case .restart:
      return context.copy {
        $0.isRestarting = true
      }
    }
  }

  /**
   On each state change, all context properties are sent to JS
   */
  private func sendChangeEventToJS(_ event: UpdatesStateEvent? = nil) {
    changeEventDelegate?.sendUpdateStateChangeEventToBridge(event?.type ?? .restart, body: [
      "context": context.json
    ])
  }

  // MARK: - Static definitions of the state machine rules

  /**
   For a particular machine state, only certain events may be processed.
   If the machine receives an unexpected event, an assertion failure will occur
   and the app will crash.
   */
  static let updatesStateAllowedEvents: [UpdatesStateValue: Set<UpdatesStateEventType>] = [
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

// swiftlint:enable no_grouping_extension
// swiftlint:enable type_name
