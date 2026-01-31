//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import Testing

@testable import EXUpdates

import EXManifests

class MockErrorRecoveryDelegate: ErrorRecoveryDelegate {
  public enum Method {
    case relaunch
    case loadRemoteUpdate
    case markFailedLaunchForLaunchedUpdate
    case markSuccessfulLaunchForLaunchedUpdate
    case throwException
  }

  public var config: EXUpdates.UpdatesConfig
  public var launchedUpdateToReturn: EXUpdates.Update? = nil
  public var remoteLoadStatus: EXUpdates.RemoteLoadStatus = .Idle

  private let relaunchCompletionParams: (Error?, Bool)

  init(config: UpdatesConfig, relaunchCompletionParams: (Error?, Bool)) {
    self.config = config
    self.relaunchCompletionParams = relaunchCompletionParams
  }

  func launchedUpdate() -> EXUpdates.Update? {
    return launchedUpdateToReturn
  }

  private var callRecord: [Method: Int] = [:]

  public func verifyCount(_ method: Method) -> Int {
    return callRecord[method] ?? 0
  }

  private func recordCall(method: Method) {
    guard let currentCount = callRecord[method] else {
      callRecord[method] = 1
      return
    }
    callRecord[method] = currentCount + 1
  }

  func relaunch(completion: (Error?, Bool) -> Void) {
    recordCall(method: .relaunch)
    completion(relaunchCompletionParams.0, relaunchCompletionParams.1)
  }

  func loadRemoteUpdate() {
    recordCall(method: .loadRemoteUpdate)
  }

  func markFailedLaunchForLaunchedUpdate() {
    recordCall(method: .markFailedLaunchForLaunchedUpdate)
  }

  func markSuccessfulLaunchForLaunchedUpdate() {
    recordCall(method: .markSuccessfulLaunchForLaunchedUpdate)
  }

  func throwException(_ exception: NSException) {
    recordCall(method: .throwException)
  }
}

private extension DispatchQueue {
  func flush() {
    self.sync {
      // flush queue
    }
  }
}

@Suite("ErrorRecovery", .serialized)
@MainActor
struct ErrorRecoveryTests {
  func setUp() -> (DispatchQueue, ErrorRecovery) {
    let testQueue = DispatchQueue(label: "expo.errorRecoveryTestQueue")
    return (testQueue, ErrorRecovery(logger: UpdatesLogger(), errorRecoveryQueue: testQueue, remoteLoadTimeout: 500))
  }

  // MARK: - handleError

  @Test
  func `NewWorkingUpdateAlreadyLoaded`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .NewUpdateLoaded
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 0)
  }

  @Test
  func `NewWorkingUpdateAlreadyLoaded_RCTContentDidAppear`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .NewUpdateLoaded
    errorRecovery.delegate = mockDelegate

    errorRecovery.startMonitoring()
    NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)

    #expect(mockDelegate.verifyCount(.markSuccessfulLaunchForLaunchedUpdate) == 1)

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.relaunch) == 0)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 1)
  }

  @Test
  func `NewUpdateLoaded_RelaunchFails`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (NSError(domain: "huh", code: 123), false)
    )
    mockDelegate.remoteLoadStatus = .NewUpdateLoaded
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 1)
  }

  @Test(.disabled("flaky on CI"))
  func `NewWorkingUpdateLoading`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Loading
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)

    mockDelegate.remoteLoadStatus = .NewUpdateLoaded
    errorRecovery.notify(newRemoteLoadStatus: .NewUpdateLoaded)

    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 0)
  }

  @Test(.disabled("flaky on CI"))
  func `NewWorkingUpdateLoading_RCTContentDidAppear`() throws {
    let (testQueue, errorRecovery) = setUp()
    // should wait a short window for new update to load, then crash
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Loading
    errorRecovery.delegate = mockDelegate

    errorRecovery.startMonitoring()
    NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
    #expect(mockDelegate.verifyCount(.markSuccessfulLaunchForLaunchedUpdate) == 1)

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)

    // make sure we're waiting
    Thread.sleep(forTimeInterval: 0.2)
    testQueue.flush()
    // don't throw yet!
    #expect(mockDelegate.verifyCount(.throwException) == 0)

    mockDelegate.remoteLoadStatus = .NewUpdateLoaded
    errorRecovery.notify(newRemoteLoadStatus: .NewUpdateLoaded)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.relaunch) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 1)
  }

  @Test
  func `NewBrokenUpdateLoaded_WorkingUpdateCached`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .NewUpdateLoaded
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)

    let error2 = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error2)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 2)
    #expect(mockDelegate.verifyCount(.relaunch) == 2)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 0)
  }

  @Test
  func `NewBrokenUpdateLoaded_UpdateAlreadyLaunchedSuccessfully`() throws {
    let (testQueue, errorRecovery) = setUp()
    // if an update has already been launched successfully, we don't want to fall back to an older update

    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let database = UpdatesDatabase()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: config,
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .NewUpdateLoaded

    let mockUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: database,
      updateId: UUID(),
      scopeKey: "wat",
      commitTime: Date(),
      runtimeVersion: "1.0",
      keep: true,
      status: .Status0_Unused,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: URL(string: "https://example.com"),
      requestHeaders: [:]
    )
    mockUpdate.successfulLaunchCount = 1

    mockDelegate.launchedUpdateToReturn = mockUpdate
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 0)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)

    mockUpdate.successfulLaunchCount = 0
    let error2 = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error2)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.throwException) == 1)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
  }

  @Test(.disabled("flaky on CI"))
  func `RemoteLoadTimesOut`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Loading
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)

    // wait for more than 500ms
    Thread.sleep(forTimeInterval: 0.6)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 0)
  }

  @Test(.disabled("flaky on CI"))
  func `RemoteLoadTimesOut_UpdateAlreadyLaunchedSuccessfully`() throws {
    let (testQueue, errorRecovery) = setUp()
    // if an update has already been launched successfully, we don't want to fall back to an older update
    let config = try UpdatesConfig.config(fromDictionary: [:])
    let database = UpdatesDatabase()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: config,
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Loading
    errorRecovery.delegate = mockDelegate

    let mockUpdate = Update(
      manifest: ManifestFactory.manifest(forManifestJSON: [:]),
      config: config,
      database: database,
      updateId: UUID(),
      scopeKey: "wat",
      commitTime: Date(),
      runtimeVersion: "1.0",
      keep: true,
      status: .Status0_Unused,
      isDevelopmentMode: false,
      assetsFromManifest: [],
      url: nil,
      requestHeaders: [:]
    )
    mockUpdate.successfulLaunchCount = 1

    mockDelegate.launchedUpdateToReturn = mockUpdate
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)

    // wait for more than 500ms
    Thread.sleep(forTimeInterval: 0.6)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.throwException) == 1)
    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 0)
    #expect(mockDelegate.verifyCount(.relaunch) == 0)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
  }

  @Test(.disabled("flaky on CI"))
  func `RemoteLoadTimesOut_RCTContentDidAppear`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Loading
    errorRecovery.delegate = mockDelegate

    errorRecovery.startMonitoring()
    NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
    #expect(mockDelegate.verifyCount(.markSuccessfulLaunchForLaunchedUpdate) == 1)

    // if RCTContentDidAppear has already fired, we don't want to roll back to an older update
    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)

    // wait for more than 500ms
    Thread.sleep(forTimeInterval: 0.6)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.throwException) == 1)
    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 0)
    #expect(mockDelegate.verifyCount(.relaunch) == 0)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
  }

  @Test
  func `NoRemoteUpdate`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Idle
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    // should try to load a remote update since we don't have one already
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 1)

    // indicate there isn't a new update from the server
    errorRecovery.notify(newRemoteLoadStatus: .Idle)
    testQueue.flush()
    #expect(mockDelegate.verifyCount(.relaunch) == 1)
  }

  @Test
  func `NoRemoteUpdate_RCTContentDidAppear`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Idle
    errorRecovery.delegate = mockDelegate

    errorRecovery.startMonitoring()
    NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
    #expect(mockDelegate.verifyCount(.markSuccessfulLaunchForLaunchedUpdate) == 1)

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    // should try to load a remote update since we don't have one already
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 1)

    // indicate there isn't a new update from the server
    errorRecovery.notify(newRemoteLoadStatus: .Idle)
    testQueue.flush()
    #expect(mockDelegate.verifyCount(.throwException) == 1)
  }

  @Test
  func `CheckAutomaticallyNever`() throws {
    let (testQueue, errorRecovery) = setUp()
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigCheckOnLaunchKey: UpdatesConfig.EXUpdatesConfigCheckOnLaunchValueNever,
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let mockDelegate = MockErrorRecoveryDelegate(
      config: config,
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Idle
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)
  }

  @Test
  func `CheckAutomaticallyNever_RCTContentDidAppear`() throws {
    let (testQueue, errorRecovery) = setUp()
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigCheckOnLaunchKey: UpdatesConfig.EXUpdatesConfigCheckOnLaunchValueNever,
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
    ])
    let mockDelegate = MockErrorRecoveryDelegate(
      config: config,
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Idle
    errorRecovery.delegate = mockDelegate

    errorRecovery.startMonitoring()
    NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
    #expect(mockDelegate.verifyCount(.markSuccessfulLaunchForLaunchedUpdate) == 1)

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.throwException) == 1)
  }

  // MARK: - multiple errors

  @Test
  func `handles two errors`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .Idle
    errorRecovery.delegate = mockDelegate

    let error = NSError(domain: "wat", code: 1)
    errorRecovery.handle(error: error)
    errorRecovery.handle(error: error)
    testQueue.flush()

    // the actual error recovery should only happen once despite there being two errors
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 1)
  }

  // MARK: - exceptions

  @Test
  func `handles exceptions`() throws {
    let (testQueue, errorRecovery) = setUp()
    let mockDelegate = MockErrorRecoveryDelegate(
      config: try UpdatesConfig.config(fromDictionary: [
        UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
        UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      ]),
      relaunchCompletionParams: (nil, true)
    )
    mockDelegate.remoteLoadStatus = .NewUpdateLoaded
    errorRecovery.delegate = mockDelegate

    let testException = NSException(name: NSExceptionName.genericException, reason: "wat")
    errorRecovery.handle(exception: testException)
    testQueue.flush()

    #expect(mockDelegate.verifyCount(.markFailedLaunchForLaunchedUpdate) == 1)
    #expect(mockDelegate.verifyCount(.relaunch) == 1)
    #expect(mockDelegate.verifyCount(.loadRemoteUpdate) == 0)
    #expect(mockDelegate.verifyCount(.throwException) == 0)
  }

  // MARK: - error log

  @Test
  func `error log consume`() {
    let logger = UpdatesLogger()
    let (testQueue, _) = setUp()
    // start with a clean slate
    _ = ErrorRecovery.consumeErrorLog(logger: logger)

    let error = NSError(domain: "TestDomain", code: 47, userInfo: [NSLocalizedDescriptionKey: "TestLocalizedDescription"])
    ErrorRecovery.writeErrorOrExceptionToLog(error, logger, dispatchQueue: testQueue)
    testQueue.flush()
    DispatchQueue.global().sync {}

    let errorLog = ErrorRecovery.consumeErrorLog(logger: logger)
    #expect(errorLog?.contains("TestDomain") == true)
    #expect(errorLog?.contains("47") == true)
    #expect(errorLog?.contains("TestLocalizedDescription") == true)
  }

  @Test
  func `error log consume multiple errors`() {
    let logger = UpdatesLogger()
    let (testQueue, _) = setUp()
    // start with a clean slate
    _ = ErrorRecovery.consumeErrorLog(logger: logger)

    let error = NSError(domain: "TestDomain", code: 47, userInfo: [NSLocalizedDescriptionKey: "TestLocalizedDescription"])
    ErrorRecovery.writeErrorOrExceptionToLog(error, logger, dispatchQueue: testQueue)

    let exception = NSException(name: NSExceptionName(rawValue: "TestName"), reason: "TestReason")
    ErrorRecovery.writeErrorOrExceptionToLog(exception, logger, dispatchQueue: testQueue)
    testQueue.flush()
    DispatchQueue.global().sync {}

    let errorLog = ErrorRecovery.consumeErrorLog(logger: logger)
    #expect(errorLog?.contains("TestDomain") == true)
    #expect(errorLog?.contains("47") == true)
    #expect(errorLog?.contains("TestLocalizedDescription") == true)
    #expect(errorLog?.contains("TestName") == true)
    #expect(errorLog?.contains("TestReason") == true)
  }
}
