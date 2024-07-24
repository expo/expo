//  Copyright © 2021 650 Industries. All rights reserved.

// swiftlint:disable file_length
// swiftlint:disable type_body_length
// swiftlint:disable legacy_objc_type

// for some reason xcode #selector requires @objc in addition to @objcMembers
// swiftlint:disable redundant_objc_attribute

// this class was writted with implicit non-null constraints between method calls. not worth restructuring to appease linter
// swiftlint:disable force_unwrapping

import Foundation
import React

// swiftlint:disable identifier_name
@objc(EXUpdatesRemoteLoadStatus)
public enum RemoteLoadStatus: Int {
  case Idle
  case Loading
  case NewUpdateLoaded
}
// swiftlint:enable identifier_name

internal protocol ErrorRecoveryDelegate: AnyObject {
  var config: UpdatesConfig { get }
  var remoteLoadStatus: RemoteLoadStatus { get }

  func launchedUpdate() -> Update?
  func relaunch(completion: @escaping (_ error: Error?, _ success: Bool) -> Void)
  func loadRemoteUpdate()

  func markFailedLaunchForLaunchedUpdate()
  func markSuccessfulLaunchForLaunchedUpdate()

  func throwException(_ exception: NSException)
}

/**
 * Entry point and main handler for the error recovery flow. Responsible for initializing the error
 * recovery handler and handler thread, and for registering (and unregistering) listeners to
 * lifecycle events so that the appropriate error recovery flows will be triggered.
 *
 * Also keeps track of and executes tasks in the error recovery pipeline, which allows us to
 * predictably and serially respond to unpredictably ordered events.
 *
 * This error recovery flow is intended to be lightweight and is *not* a full safety net whose
 * purpose is to avoid crashes at all costs. Rather, its primary purpose is to prevent bad updates
 * from "bricking" an app by causing crashes before there is ever a chance to download a fix.
 *
 * When an error is caught, the pipeline is started and executes the following tasks serially:
 * (a) check for a new update and start downloading if there is one
 * (b) if there is a new update, reload and launch the new update
 * (c) if not, or if another error occurs, fall back to an older working update (if one exists)
 * (d) crash.
 *
 * Importantly, (b) and (c) will be taken out of the pipeline as soon as the first root view render
 * occurs. If any update modifies persistent state in a non-backwards-compatible way, it isn't
 * safe to automatically roll back; we use the first root view render as a rough proxy for this
 * (assuming it's unlikely an app will make significant modifications to persisted state before its
 * initial render).
 *
 * Also, the error listener will be unregistered 10 seconds after content has appeared; we assume
 * that by this point, expo-updates has had enough time to download a new update if there is one,
 * and so there is no more need to trigger the error recovery pipeline.
 *
 * This pipeline will not be triggered at all for errors caught more than 10 seconds after content
 * has appeared; it is assumed that by this point, expo-updates will have had enough time to
 * download a new update if there is one, and so there is no more need to intervene.
 *
 * This behavior is documented in more detail at https://docs.expo.dev/bare/error-recovery/.
 */
@objc(EXUpdatesErrorRecovery)
@objcMembers
public final class ErrorRecovery: NSObject {
  enum ErrorRecoveryTask {
    case waitForRemoteUpdate
    case launchNew
    case launchCached
    case crash
  }

  private static let ErrorLogFile = "expo-error.log"
  private static let RemoteLoadTimeoutMs = 5000

  internal weak var delegate: (any ErrorRecoveryDelegate)?

  private var pipeline: [ErrorRecoveryTask]
  private var isRunning: Bool
  private var isWaitingForRemoteUpdate: Bool
  private var rctContentHasAppeared: Bool
  private let remoteLoadTimeout: Int

  private let errorRecoveryQueue: DispatchQueue

  private var encounteredErrors: [Any]

  private var previousFatalErrorHandler: RCTFatalHandler?
  private var previousFatalExceptionHandler: RCTFatalExceptionHandler?

  private let logger: UpdatesLogger

  public convenience override init() {
    self.init(
      errorRecoveryQueue: DispatchQueue(label: "expo.controller.errorRecoveryQueue"),
      remoteLoadTimeout: ErrorRecovery.RemoteLoadTimeoutMs
    )
  }

  public required init(
    errorRecoveryQueue: DispatchQueue,
    remoteLoadTimeout: Int
  ) {
    // tasks should never be added to the pipeline after this point, only removed
    self.pipeline = [
      .waitForRemoteUpdate,
      .launchNew,
      .launchCached,
      .crash
    ]
    self.isRunning = false
    self.isWaitingForRemoteUpdate = false
    self.rctContentHasAppeared = false
    self.errorRecoveryQueue = errorRecoveryQueue
    self.remoteLoadTimeout = remoteLoadTimeout
    self.encounteredErrors = []
    self.logger = UpdatesLogger()
  }

  public func startMonitoring() {
    setRCTErrorHandlers()
  }

  public func handle(error: NSError) {
    startPipeline(withEncounteredError: error)
    ErrorRecovery.writeErrorOrExceptionToLog(error)
  }

  public func handle(exception: NSException) {
    startPipeline(withEncounteredError: exception)
    ErrorRecovery.writeErrorOrExceptionToLog(exception)
  }

  public func notify(newRemoteLoadStatus newStatus: RemoteLoadStatus) {
    errorRecoveryQueue.async {
      if !self.isWaitingForRemoteUpdate {
        return
      }

      self.isWaitingForRemoteUpdate = false
      if newStatus != .NewUpdateLoaded {
        self.pipeline.remove(.launchNew)
      }
      self.runNextTask()
    }
  }

  // MARK: - pipeline tasks

  private func startPipeline(withEncounteredError encounteredError: Any) {
    errorRecoveryQueue.async {
      self.encounteredErrors.append(encounteredError)

      if let launchedUpdate = self.delegate?.launchedUpdate(),
        launchedUpdate.successfulLaunchCount > 0 {
        self.pipeline.remove(.launchCached)
      } else if !self.rctContentHasAppeared {
        self.delegate?.markFailedLaunchForLaunchedUpdate()
      }

      if !self.isRunning {
        self.isRunning = true
        self.runNextTask()
      }
    }
  }

  private func runNextTask() {
    dispatchPrecondition(condition: .onQueue(errorRecoveryQueue))
    let nextTask = pipeline.first!
    pipeline.remove(at: 0)

    switch nextTask {
    case .waitForRemoteUpdate:
      logger.info(message: "ErrorRecovery: attempting to fetch a new update, waiting")
      waitForRemoteLoaderToFinish()
    case .launchNew:
      logger.info(message: "ErrorRecovery: launching a new update")
      tryRelaunchFromCache()
    case .launchCached:
      logger.info(message: "ErrorRecovery: launching a cached update")
      tryRelaunchFromCache()
    case .crash:
      logger.error(message: "ErrorRecovery: could not recover from error, crashing", code: .updateFailedToLoad)
      crash()
    }
  }

  private func waitForRemoteLoaderToFinish() {
    dispatchPrecondition(condition: .onQueue(errorRecoveryQueue))

    if let delegate = delegate, delegate.remoteLoadStatus == .NewUpdateLoaded {
      runNextTask()
    } else if let delegate = delegate, delegate.config.checkOnLaunch != .Never || delegate.remoteLoadStatus == .Loading {
      isWaitingForRemoteUpdate = true
      if delegate.remoteLoadStatus != .Loading {
        delegate.loadRemoteUpdate()
      }

      errorRecoveryQueue.asyncAfter(deadline: DispatchTime.now() + .milliseconds(remoteLoadTimeout)) {
        if !self.isWaitingForRemoteUpdate {
          return
        }

        self.isWaitingForRemoteUpdate = false
        self.pipeline.remove(.launchNew)
        self.runNextTask()
      }
      return
    } else {
      // there's no remote update, so move to the next step in the pipeline
      pipeline.remove(.launchNew)
      runNextTask()
    }
  }

  private func tryRelaunchFromCache() {
    dispatchPrecondition(condition: .onQueue(errorRecoveryQueue))
    delegate?.relaunch { error, success in
      self.errorRecoveryQueue.async {
        if !success {
          if let error = error {
            self.encounteredErrors.append(error)
          }

          self.pipeline.remove(.launchNew)
          self.pipeline.remove(.launchCached)
          self.runNextTask()
        } else {
          self.isRunning = false
        }
      }
    }
  }

  private func crash() {
    // create new exception object from stack of errors
    // use the initial error and put the rest into userInfo
    let initialError = encounteredErrors.first!
    encounteredErrors.remove(at: 0)

    if let initialError = initialError as? NSError,
      let previousFatalErrorHandler = previousFatalErrorHandler {
      previousFatalErrorHandler(initialError)
    } else if let initialError = initialError as? NSException,
      let previousFatalExceptionHandler = previousFatalExceptionHandler {
      previousFatalExceptionHandler(initialError)
    }

    var name: NSExceptionName
    var reason: String?
    var userInfo: [AnyHashable: Any]
    if let initialError = initialError as? NSError {
      // format these keys similar to RN -- RCTFatal in RCTAssert.m
      name = NSExceptionName(rawValue: "\(RCTFatalExceptionName): \(initialError.localizedDescription)")
      reason = RCTFormatError(initialError.localizedDescription, (initialError.userInfo[RCTJSStackTraceKey] as? [[String: Any]]), 175)
      userInfo = initialError.userInfo
      userInfo["RCTUntruncatedMessageKey"] = RCTFormatError(
        initialError.localizedDescription,
        (initialError.userInfo[RCTJSStackTraceKey] as? [[String: Any]]),
        0
      )
    } else if let initialError = initialError as? NSException {
      name = initialError.name
      reason = initialError.reason
      userInfo = initialError.userInfo ?? [:]
    } else {
      preconditionFailure("Shouldn't add object types other than NSError or NSException to encounteredErrors")
    }

    userInfo["EXUpdatesLaterEncounteredErrors"] = encounteredErrors
    delegate?.throwException(NSException(name: name, reason: reason, userInfo: userInfo))
  }

  // MARK: - monitoring / lifecycle

  private func registerObservers() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleJavaScriptDidFailToLoad),
      name: NSNotification.Name.RCTJavaScriptDidFailToLoad,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleContentDidAppear),
      name: NSNotification.Name.RCTContentDidAppear,
      object: nil
    )
  }

  private func unregisterObservers() {
    NotificationCenter.default.removeObserver(self, name: NSNotification.Name.RCTJavaScriptDidFailToLoad, object: nil)
    NotificationCenter.default.removeObserver(self, name: NSNotification.Name.RCTContentDidAppear, object: nil)
  }

  @objc private func handleJavaScriptDidFailToLoad() {
    unregisterObservers()
  }

  @objc private func handleContentDidAppear() {
    unregisterObservers()
    delegate?.markSuccessfulLaunchForLaunchedUpdate()
    errorRecoveryQueue.async {
      self.rctContentHasAppeared = true
      // the launch now counts as "successful" so we don't want to roll back;
      // remove any extraneous tasks from the pipeline as such
      self.pipeline = self.pipeline.filter({ task in
        task == .waitForRemoteUpdate || task == .crash
      })
    }
    // wait 10s before unsetting error handlers; even though we won't try to relaunch if our handlers
    // are triggered after now, we still want to give the app a reasonable window of time to start the
    // ErrorRecoveryTaskWaitForRemoteUpdate task and check for a new update is there is one
    errorRecoveryQueue.asyncAfter(deadline: DispatchTime.now() + .seconds(10)) {
      self.unsetRCTErrorHandlers()
    }
  }

  private func setRCTErrorHandlers() {
    errorRecoveryQueue.async {
      self.rctContentHasAppeared = false
    }
    registerObservers()

    if previousFatalErrorHandler != nil || previousFatalExceptionHandler != nil {
      return
    }

    previousFatalErrorHandler = RCTGetFatalHandler()
    previousFatalExceptionHandler = RCTGetFatalExceptionHandler()

    RCTSetFatalHandler { error in
      self.handle(error: error! as NSError)
    }
    RCTSetFatalExceptionHandler { exception in
      self.handle(exception: exception!)
    }
  }

  private func unsetRCTErrorHandlers() {
    RCTSetFatalHandler(previousFatalErrorHandler)
    RCTSetFatalExceptionHandler(previousFatalExceptionHandler)
    previousFatalErrorHandler = nil
    previousFatalExceptionHandler = nil
  }

  // MARK: - error persisting

  public static func consumeErrorLog() -> String? {
    let errorLogFile = errorLogFile()
    guard let data = try? Data(contentsOf: errorLogFile) else {
      return nil
    }

    do {
      try FileManager.default.removeItem(at: errorLogFile)
    } catch {
      NSLog("Could not delete error log: %@", error.localizedDescription)
    }

    return String(data: data, encoding: .utf8)
  }

  public static func writeErrorOrExceptionToLog(_ errorOrException: Any, dispatchQueue: DispatchQueue = DispatchQueue.global()) {
    dispatchQueue.async {
      var serializedError: String
      if let errorOrException = errorOrException as? NSError {
        serializedError = "Fatal error: \(ErrorRecovery.serialize(error: errorOrException))"
      } else if let errorOrException = errorOrException as? NSException {
        serializedError = "Fatal exception: \(ErrorRecovery.serialize(exception: errorOrException))"
      } else {
        return
      }

      UpdatesLogger().error(message: "ErrorRecovery fatal exception: \(serializedError)", code: .jsRuntimeError)
      let data = serializedError.data(using: .utf8)!
      let errorLogFile = ErrorRecovery.errorLogFile()
      if FileManager.default.fileExists(atPath: errorLogFile.path) {
        if let fileHandle = FileHandle(forWritingAtPath: errorLogFile.path) {
          fileHandle.seekToEndOfFile()
          fileHandle.write(data)
          fileHandle.closeFile()
        }
      } else {
        do {
          try data.write(to: errorLogFile, options: .atomic)
        } catch {
          NSLog("Could not write fatal error to log: %@", error.localizedDescription)
        }
      }
    }
  }

  private static func serialize(exception: NSException) -> String {
    return String(
      format: "Time: %f\nName: %@\nReason: %@\n\n",
      Date().timeIntervalSince1970 * 1000,
      exception.name.rawValue,
      exception.reason ?? ""
    )
  }

  private static func serialize(error: NSError) -> String {
    let localizedFailureReason = error.localizedFailureReason
    let underlyingError = error.userInfo[NSUnderlyingErrorKey]

    var serialization = String(
      format: "Time: %f\nDomain: %@\nCode: %li\nDescription: %@",
      Date().timeIntervalSince1970 * 1000,
      error.domain,
      error.code,
      error.localizedDescription
    )

    if let localizedFailureReason = localizedFailureReason {
      serialization = serialization.appendingFormat("\nFailure Reason: %@", localizedFailureReason)
    }
    if let underlyingError = underlyingError as? NSError {
      serialization = serialization.appendingFormat("\n\nUnderlying Error:\n%@", serialize(error: underlyingError))
    }
    serialization += "\n\n"
    return serialization
  }

  private static func errorLogFile() -> URL {
    let applicationDocumentsDirectory = UpdatesUtils.updatesApplicationDocumentsDirectory()
    return applicationDocumentsDirectory.appendingPathComponent(ErrorLogFile)
  }
}
