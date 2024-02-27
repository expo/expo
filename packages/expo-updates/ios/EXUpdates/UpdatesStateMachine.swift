//  Copyright © 2023 650 Industries. All rights reserved.

// swiftlint:disable no_grouping_extension
// swiftlint:disable type_name

import Foundation

/**
 Protocol with a method for sending state change events to JS.
 In production, this will be implemented by the AppController.sharedInstance.
 */
internal protocol UpdatesStateChangeDelegate: AnyObject {
  func sendUpdateStateChangeEventToAppContext(_ eventType: UpdatesStateEventType, body: [String: Any?])
}

// MARK: - Enums

/**
 All the possible states the machine can take.
 */
internal enum UpdatesStateValue: String, CaseIterable {
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
  var rollbackCommitTime: Date? { get }
  var error: [String: String]? { get }
}

internal struct UpdatesStateEventCheck: UpdatesStateEvent {
  let type: UpdatesStateEventType = .check
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventDownload: UpdatesStateEvent {
  let type: UpdatesStateEventType = .download
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventRestart: UpdatesStateEvent {
  let type: UpdatesStateEventType = .restart
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventCheckError: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkError
  let manifest: [String: Any]? = nil
  let message: String?
  let rollbackCommitTime: Date? = nil
  var error: [String: String]? {
    return (message != nil) ? ["message": message ?? ""] : nil
  }
}

internal struct UpdatesStateEventDownloadError: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadError
  let manifest: [String: Any]? = nil
  let message: String?
  let rollbackCommitTime: Date? = nil
  var error: [String: String]? {
    return (message != nil) ? ["message": message ?? ""] : nil
  }
}

internal struct UpdatesStateEventCheckCompleteWithUpdate: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkCompleteAvailable
  let manifest: [String: Any]?
  let message: String? = nil
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventCheckCompleteWithRollback: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkCompleteAvailable
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let rollbackCommitTime: Date?
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventCheckComplete: UpdatesStateEvent {
  let type: UpdatesStateEventType = .checkCompleteUnavailable
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventDownloadCompleteWithUpdate: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadComplete
  let manifest: [String: Any]?
  let message: String? = nil
  let isRollback: Bool = false
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventDownloadCompleteWithRollback: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadComplete
  let manifest: [String: Any]? = nil
  let message: String? = nil
  // Rollback commit time is captured during check, not during download
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

internal struct UpdatesStateEventDownloadComplete: UpdatesStateEvent {
  let type: UpdatesStateEventType = .downloadComplete
  let manifest: [String: Any]? = nil
  let message: String? = nil
  let rollbackCommitTime: Date? = nil
  let error: [String: String]? = nil
}

/**
 Date formatter for the last check times sent in JS events
 */
let iso8601DateFormatter = ISO8601DateFormatter()

/**
 Structure for a rollback. Only the commitTime is used for now.
 */
internal struct UpdatesStateContextRollback {
  let commitTime: Date

  var json: [String: Any] {
    return [
      "commitTime": iso8601DateFormatter.string(from: commitTime)
    ]
  }
}

/**
 The state machine context, with information that will be readable from JS.
 */
public struct UpdatesStateContext {
  let isUpdateAvailable: Bool
  let isUpdatePending: Bool
  let isRollback: Bool
  let isChecking: Bool
  let isDownloading: Bool
  let isRestarting: Bool
  let latestManifest: [String: Any]?
  let downloadedManifest: [String: Any]?
  let rollback: UpdatesStateContextRollback?
  let checkError: [String: String]?
  let downloadError: [String: String]?
  let lastCheckForUpdateTime: Date?

  private var lastCheckForUpdateTimeDateString: String? {
    guard let lastCheckForUpdateTime = lastCheckForUpdateTime else {
      return nil
    }
    return iso8601DateFormatter.string(from: lastCheckForUpdateTime)
  }

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
      "downloadError": self.downloadError,
      "lastCheckForUpdateTimeString": lastCheckForUpdateTimeDateString,
      "rollback": rollback?.json
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
    self.lastCheckForUpdateTime = nil
    self.rollback = nil
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
    var checkError: [String: String]?
    var downloadError: [String: String]?
    var lastCheckForUpdateTime: Date?
    var rollback: UpdatesStateContextRollback?

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
      self.lastCheckForUpdateTime = original.lastCheckForUpdateTime
      self.rollback = original.rollback
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
        rollback: rollback,
        checkError: checkError,
        downloadError: downloadError,
        lastCheckForUpdateTime: lastCheckForUpdateTime
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
  private let validUpdatesStateValues: Set<UpdatesStateValue>

  required init(validUpdatesStateValues: Set<UpdatesStateValue>) {
    self.validUpdatesStateValues = validUpdatesStateValues
  }

  private let logger = UpdatesLogger()

  private lazy var serialExecutorQueue: StateMachineSerialExecutorQueue = {
    return StateMachineSerialExecutorQueue(
      updatesLogger: logger,
      stateMachineProcedureContext: StateMachineProcedureContext(
        processStateEventCallback: { event in
          self.processEvent(event)
        },
        getCurrentStateCallback: {
          return self.state
        },
        resetStateCallback: {
          return self.reset()
        }
      )
    )
  }()

  // MARK: - Public methods and properties

  /**
   Queue a StateMachineProcedure procedure for serial execution.
   */
  func queueExecution(stateMachineProcedure: StateMachineProcedure) {
    serialExecutorQueue.queueExecution(stateMachineProcedure: stateMachineProcedure)
  }

  /**
   In production, this is the AppController instance.
   */
  internal weak var changeEventDelegate: (any UpdatesStateChangeDelegate)?

  /**
   The current state
   */
  private var state: UpdatesStateValue = .idle
  internal func getStateForTesting() -> UpdatesStateValue {
    return state
  }

  /**
   The context
   */
  internal var context: UpdatesStateContext = UpdatesStateContext()

  /**
   Reset the machine to its starting state. Should only be called after the app restarts (reloadAsync()).
   */
  private func reset() {
    state = .idle
    context = UpdatesStateContext()
    logger.info(message: "Updates state is reset, state = \(state), context = \(context)")
    sendChangeEventToJS()
  }
  internal func resetForTesting() {
    reset()
  }

  /**
   Transition the state machine forward to a new state.
   */
  private func processEvent(_ event: UpdatesStateEvent) {
    // Execute state transition
    if transition(event) {
      // Only change context if transition succeeds
      context = reducedContext(context, event)
      logger.info(message: "Updates state change: state = \(state), event = \(event.type), context = \(context)")
      // Send change event
      sendChangeEventToJS(event)
    }
  }
  internal func processEventForTesting(_ event: UpdatesStateEvent) {
    processEvent(event)
  }

  // MARK: - Private methods

  /**
   Make sure the state transition is allowed, and then update the state.
   */
  private func transition(_ event: UpdatesStateEvent) -> Bool {
    let allowedEvents: Set<UpdatesStateEventType> = UpdatesStateMachine.updatesStateAllowedEvents[state] ?? []
    if !allowedEvents.contains(event.type) {
      assertionFailure("UpdatesState: invalid transition requested: state = \(state), event = \(event.type)")
      return false
    }
    let newStateValue = UpdatesStateMachine.updatesStateTransitions[event.type] ?? .idle
    if !validUpdatesStateValues.contains(newStateValue) {
      assertionFailure("UpdatesState: invalid transition requested: state = \(state), event = \(event.type)")
      return false
    }
    // Successful transition
    state = newStateValue
    return true
  }

  /**
   Given an allowed event and a context, return a new context with the changes
   made by processing the event.
   */
  private func reducedContext(_ context: UpdatesStateContext, _ event: UpdatesStateEvent) -> UpdatesStateContext {
    let rollback: UpdatesStateContextRollback?
    if let rollbackCommitTime = event.rollbackCommitTime {
      rollback = UpdatesStateContextRollback(commitTime: rollbackCommitTime)
    } else {
      rollback = nil
    }

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
        $0.lastCheckForUpdateTime = Date()
        $0.rollback = nil
      }
    case .checkCompleteAvailable:
      return context.copy {
        $0.isChecking = false
        $0.checkError = nil
        $0.latestManifest = event.manifest
        $0.isUpdateAvailable = true
        $0.lastCheckForUpdateTime = Date()
        $0.rollback = rollback
      }
    case .checkError:
      return context.copy {
        $0.isChecking = false
        $0.checkError = event.error
        $0.lastCheckForUpdateTime = Date()
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
    changeEventDelegate?.sendUpdateStateChangeEventToAppContext(event?.type ?? .restart, body: [
      "context": context.json
    ])
  }

  // MARK: - Static definitions of the state machine rules

  /**
   For a particular machine state, only certain events may be processed.
   If the machine receives an unexpected event, an assertion failure will occur
   and the app will crash.
   */
  private static let updatesStateAllowedEvents: [UpdatesStateValue: Set<UpdatesStateEventType>] = [
    .idle: [.check, .download, .restart],
    .checking: [.checkCompleteAvailable, .checkCompleteUnavailable, .checkError],
    .downloading: [.downloadComplete, .downloadError],
    .restarting: []
  ]

  /**
   For this state machine, each event has only one destination state that the
   machine will transition to.
   */
  private static let updatesStateTransitions: [UpdatesStateEventType: UpdatesStateValue] = [
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
