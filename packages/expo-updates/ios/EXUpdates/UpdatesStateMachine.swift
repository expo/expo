//  Copyright © 2023 650 Industries. All rights reserved.

// swiftlint:disable no_grouping_extension

import Foundation

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

// MARK: - Data structures

/**
 All the possible types of events that can be sent to the machine. Each event
 will cause the machine to transition to a new state.
 */
internal enum UpdatesStateEvent {
  case startStartup
  case endStartup
  case check
  case checkCompleteUnavailable
  case checkCompleteWithUpdate(manifest: [String: Any])
  case checkCompleteWithRollback(rollbackCommitTime: Date)
  case checkError(errorMessage: String)
  case download
  case downloadComplete
  case downloadCompleteWithUpdate(manifest: [String: Any])
  case downloadCompleteWithRollback
  case downloadError(errorMessage: String)
  case downloadProgress(progress: Double)
  case restart

  internal enum InternalType {
    case startStartup
    case endStartup
    case check
    case checkCompleteUnavailable
    case checkCompleteAvailable
    case checkError
    case download
    case downloadProgress
    case downloadComplete
    case downloadError
    case restart
  }

  var type: InternalType {
    switch self {
    case .startStartup:
      return .startStartup
    case .endStartup:
      return .endStartup
    case .check:
      return .check
    case .checkCompleteUnavailable:
      return .checkCompleteUnavailable
    case .checkCompleteWithUpdate:
      return .checkCompleteAvailable
    case .checkCompleteWithRollback:
      return .checkCompleteAvailable
    case .checkError:
      return .checkError
    case .download:
      return .download
    case .downloadProgress:
      return .downloadProgress
    case .downloadComplete:
      return .downloadComplete
    case .downloadCompleteWithUpdate:
      return .downloadComplete
    case .downloadCompleteWithRollback:
      return .downloadComplete
    case .downloadError:
      return .downloadError
    case .restart:
      return .restart
    }
  }
}

/**
 Date formatter for the last check times sent in JS events
 */
let iso8601DateFormatter = ISO8601DateFormatter()

/**
 Structure for a rollback. Only the commitTime is used for now.
 */
public struct UpdatesStateContextRollback {
  public let commitTime: Date

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
  public let isStartupProcedureRunning: Bool
  public let isUpdateAvailable: Bool
  public let isUpdatePending: Bool
  public let isChecking: Bool
  public let isDownloading: Bool
  public let isRestarting: Bool
  public let restartCount: Int
  public let latestManifest: [String: Any]?
  public let downloadedManifest: [String: Any]?
  public let rollback: UpdatesStateContextRollback?
  public let checkError: [String: String]?
  public let downloadError: [String: String]?
  public let downloadProgress: Double
  public let lastCheckForUpdateTime: Date?
  public let sequenceNumber: Int

  private var lastCheckForUpdateTimeDateString: String? {
    guard let lastCheckForUpdateTime = lastCheckForUpdateTime else {
      return nil
    }
    return iso8601DateFormatter.string(from: lastCheckForUpdateTime)
  }

  var json: [String: Any?] {
    return [
      "isStartupProcedureRunning": self.isStartupProcedureRunning,
      "isUpdateAvailable": self.isUpdateAvailable,
      "isUpdatePending": self.isUpdatePending,
      "isChecking": self.isChecking,
      "isDownloading": self.isDownloading,
      "isRestarting": self.isRestarting,
      "restartCount": self.restartCount,
      "latestManifest": self.latestManifest,
      "downloadedManifest": self.downloadedManifest,
      "checkError": self.checkError,
      "downloadError": self.downloadError,
      "downloadProgress": self.downloadProgress,
      "lastCheckForUpdateTimeString": lastCheckForUpdateTimeDateString,
      "rollback": rollback?.json,
      "sequenceNumber": sequenceNumber
    ] as [String: Any?]
  }
}

public extension UpdatesStateContext {
  init() {
    self.isStartupProcedureRunning = false
    self.isUpdateAvailable = false
    self.isUpdatePending = false
    self.isChecking = false
    self.isDownloading = false
    self.isRestarting = false
    self.restartCount = 0
    self.latestManifest = nil
    self.downloadedManifest = nil
    self.checkError = nil
    self.downloadError = nil
    self.downloadProgress = 0.0
    self.lastCheckForUpdateTime = nil
    self.rollback = nil
    self.sequenceNumber = 0
  }

  // struct copy, lets you overwrite specific variables retaining the value of the rest
  // using a closure to set the new values for the copy of the struct
  func copyAndIncrementSequenceNumber(build: (inout Builder) -> Void) -> UpdatesStateContext {
    var builder = Builder(original: self)
    build(&builder)
    return builder.toContext(newRestartCount: self.restartCount, newSequenceNumber: self.sequenceNumber + 1)
  }

  func resetCopyWithIncrementedRestartCountAndSequenceNumber() -> UpdatesStateContext {
    let builder = Builder(original: UpdatesStateContext())
    return builder.toContext(newRestartCount: self.restartCount + 1, newSequenceNumber: self.sequenceNumber + 1)
  }

  struct Builder {
    var isStartupProcedureRunning: Bool = false
    var isUpdateAvailable: Bool = false
    var isUpdatePending: Bool = false
    var isChecking: Bool = false
    var isDownloading: Bool = false
    var isRestarting: Bool = false
    var restartCount: Int = 0
    var latestManifest: [String: Any]?
    var downloadedManifest: [String: Any]?
    var checkError: [String: String]?
    var downloadProgress: Double = 0
    var downloadError: [String: String]?
    var lastCheckForUpdateTime: Date?
    var rollback: UpdatesStateContextRollback?

    fileprivate init(original: UpdatesStateContext) {
      self.isStartupProcedureRunning = original.isStartupProcedureRunning
      self.isUpdateAvailable = original.isUpdateAvailable
      self.isUpdatePending = original.isUpdatePending
      self.isChecking = original.isChecking
      self.isDownloading = original.isDownloading
      self.isRestarting = original.isRestarting
      self.restartCount = original.restartCount
      self.latestManifest = original.latestManifest
      self.downloadedManifest = original.downloadedManifest
      self.checkError = original.checkError
      self.downloadError = original.downloadError
      self.downloadProgress = original.downloadProgress
      self.lastCheckForUpdateTime = original.lastCheckForUpdateTime
      self.rollback = original.rollback
    }

    fileprivate func toContext(newRestartCount: Int, newSequenceNumber: Int) -> UpdatesStateContext {
      return UpdatesStateContext(
        isStartupProcedureRunning: isStartupProcedureRunning,
        isUpdateAvailable: isUpdateAvailable,
        isUpdatePending: isUpdatePending,
        isChecking: isChecking,
        isDownloading: isDownloading,
        isRestarting: isRestarting,
        restartCount: newRestartCount,
        latestManifest: latestManifest,
        downloadedManifest: downloadedManifest,
        rollback: rollback,
        checkError: checkError,
        downloadError: downloadError,
        downloadProgress: downloadProgress,
        lastCheckForUpdateTime: lastCheckForUpdateTime,
        sequenceNumber: newSequenceNumber
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
  private let logger: UpdatesLogger
  private let eventManager: UpdatesEventManager
  private let validUpdatesStateValues: Set<UpdatesStateValue>

  required init(logger: UpdatesLogger, eventManager: UpdatesEventManager, validUpdatesStateValues: Set<UpdatesStateValue>) {
    self.logger = logger
    self.eventManager = eventManager
    self.validUpdatesStateValues = validUpdatesStateValues
  }

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
        resetStateAfterRestartCallback: {
          return self.resetAndIncrementRestartCount()
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
  private func resetAndIncrementRestartCount() {
    state = .idle
    context = context.resetCopyWithIncrementedRestartCountAndSequenceNumber()
    logger.info(message: "Updates state is reset, state = \(state), context = \(context)")
    sendContextToJS()
  }
  internal func resetAndIncrementRestartCountForTesting() {
    resetAndIncrementRestartCount()
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
      sendContextToJS()
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
    let allowedEvents: Set<UpdatesStateEvent.InternalType> = UpdatesStateMachine.updatesStateAllowedEvents[state] ?? []
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
    switch event {
    case .startStartup:
      return context.copyAndIncrementSequenceNumber {
        $0.isStartupProcedureRunning = true
      }
    case .endStartup:
      return context.copyAndIncrementSequenceNumber {
        $0.isStartupProcedureRunning = false
      }
    case .check:
      return context.copyAndIncrementSequenceNumber {
        $0.isChecking = true
      }
    case .checkCompleteUnavailable:
      return context.copyAndIncrementSequenceNumber {
        $0.isChecking = false
        $0.checkError = nil
        $0.latestManifest = nil
        $0.rollback = nil
        $0.isUpdateAvailable = false
        $0.lastCheckForUpdateTime = Date()
      }
    case let .checkCompleteWithRollback(rollbackCommitTime):
      return context.copyAndIncrementSequenceNumber {
        $0.isChecking = false
        $0.checkError = nil
        $0.latestManifest = nil
        $0.rollback = UpdatesStateContextRollback(commitTime: rollbackCommitTime)
        $0.isUpdateAvailable = true
        $0.lastCheckForUpdateTime = Date()
      }
    case let .checkCompleteWithUpdate(manifest):
      return context.copyAndIncrementSequenceNumber {
        $0.isChecking = false
        $0.checkError = nil
        $0.latestManifest = manifest
        $0.rollback = nil
        $0.isUpdateAvailable = true
        $0.lastCheckForUpdateTime = Date()
      }
    case let .checkError(errorMessage):
      return context.copyAndIncrementSequenceNumber {
        $0.isChecking = false
        $0.checkError = ["message": errorMessage]
        $0.lastCheckForUpdateTime = Date()
      }
    case .download:
      return context.copyAndIncrementSequenceNumber {
        $0.downloadProgress = 0.0
        $0.isDownloading = true
      }
    case let .downloadProgress(progress):
      return context.copyAndIncrementSequenceNumber {
        $0.downloadProgress = progress
      }
    case .downloadComplete:
      return context.copyAndIncrementSequenceNumber {
        $0.isDownloading = false
        $0.downloadError = nil
        $0.isUpdatePending = true
        $0.downloadProgress = 1.0
      }
    case .downloadCompleteWithRollback:
      return context.copyAndIncrementSequenceNumber {
        $0.isDownloading = false
        $0.downloadError = nil
        $0.isUpdatePending = true
      }
    case let .downloadCompleteWithUpdate(manifest):
      return context.copyAndIncrementSequenceNumber {
        $0.isDownloading = false
        $0.downloadError = nil
        $0.latestManifest = manifest
        $0.downloadedManifest = manifest
        $0.rollback = nil
        $0.isUpdatePending = true
        $0.isUpdateAvailable = true
      }
    case let .downloadError(errorMessage):
      return context.copyAndIncrementSequenceNumber {
        $0.isDownloading = false
        $0.downloadError = ["message": errorMessage]
      }
    case .restart:
      return context.copyAndIncrementSequenceNumber {
        $0.isRestarting = true
      }
    }
  }

  /**
   On each state change, all context properties are sent to JS.
   The owning controller should also request a re-emit of context to JS upon event emitter observation.
   */
  internal func sendContextToJS() {
    eventManager.sendStateMachineContextEvent(context: context)
  }

  // MARK: - Static definitions of the state machine rules

  /**
   For a particular machine state, only certain events may be processed.
   If the machine receives an unexpected event, an assertion failure will occur
   and the app will crash.
   */
  private static let updatesStateAllowedEvents: [UpdatesStateValue: Set<UpdatesStateEvent.InternalType>] = [
    .idle: [.startStartup, .endStartup, .check, .download, .restart],
    .checking: [.checkCompleteAvailable, .checkCompleteUnavailable, .checkError],
    .downloading: [.downloadComplete, .downloadError, .downloadProgress],
    .restarting: []
  ]

  /**
   For this state machine, each event has only one destination state that the
   machine will transition to.
   */
  private static let updatesStateTransitions: [UpdatesStateEvent.InternalType: UpdatesStateValue] = [
    .startStartup: .idle,
    .endStartup: .idle,
    .check: .checking,
    .checkCompleteAvailable: .idle,
    .checkCompleteUnavailable: .idle,
    .checkError: .idle,
    .download: .downloading,
    .downloadProgress: .downloading,
    .downloadComplete: .idle,
    .downloadError: .idle,
    .restart: .restarting
  ]
}

// swiftlint:enable no_grouping_extension
