//  Copyright (c) 2020 650 Industries, Inc. All rights reserved.

import ExpoModulesTestCore

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
  public func verify(_ method: Method, times: Int = 1) {
    let nTimes = self.callRecord[method] ?? 0
    expect(nTimes).to(equal(times), description: "Method \(method) called \(nTimes) times, expected \(times)")
  }
  public func never(_ method: Method) {
    verify(method, times: 0)
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

class ErrorRecoverySpec : ExpoSpec {
  override class func spec() {
    func setUp() -> (DispatchQueue, ErrorRecovery) {
      let testQueue = DispatchQueue(label: "expo.errorRecoveryTestQueue")
      return (testQueue, ErrorRecovery(logger: UpdatesLogger(), errorRecoveryQueue: testQueue, remoteLoadTimeout: 500))
    }
    
    describe("handleError") {
      it("NewWorkingUpdateAlreadyLoaded") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
        mockDelegate.never(.throwException)
      }
      
      it("NewWorkingUpdateAlreadyLoaded_RCTContentDidAppear") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
            UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
            UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          ]),
          relaunchCompletionParams: (nil, true)
        )
        mockDelegate.remoteLoadStatus = .NewUpdateLoaded
        errorRecovery.delegate = mockDelegate
        
        errorRecovery.startMonitoring()
        NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
        
        mockDelegate.verify(.markSuccessfulLaunchForLaunchedUpdate)
        
        let error = NSError(domain: "wat", code: 1)
        errorRecovery.handle(error: error)
        testQueue.flush()
        
        mockDelegate.never(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
        mockDelegate.verify(.throwException)
      }
      
      it("NewUpdateLoaded_RelaunchFails") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
        mockDelegate.verify(.throwException)
      }
      
      // TODO(eric): make these tests less flaky on CI and reenable them
      xit("NewWorkingUpdateLoading") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
        mockDelegate.never(.throwException)
      }
      
      xit("NewWorkingUpdateLoading_RCTContentDidAppear") {
        let (testQueue, errorRecovery) = setUp()
        // should wait a short window for new update to load, then crash
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
            UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
            UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          ]),
          relaunchCompletionParams: (nil, true)
        )
        mockDelegate.remoteLoadStatus = .Loading
        errorRecovery.delegate = mockDelegate
        
        errorRecovery.startMonitoring()
        NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
        mockDelegate.verify(.markSuccessfulLaunchForLaunchedUpdate)
        
        let error = NSError(domain: "wat", code: 1)
        errorRecovery.handle(error: error)
        
        // make sure we're waiting
        Thread.sleep(forTimeInterval: 0.2)
        testQueue.flush()
        // don't throw yet!
        mockDelegate.never(.throwException)
        
        mockDelegate.remoteLoadStatus = .NewUpdateLoaded
        errorRecovery.notify(newRemoteLoadStatus: .NewUpdateLoaded)
        testQueue.flush()
        
        mockDelegate.never(.relaunch)
        mockDelegate.verify(.throwException)
      }
      
      it("NewBrokenUpdateLoaded_WorkingUpdateCached") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
        
        let error2 = NSError(domain: "wat", code: 1)
        errorRecovery.handle(error: error2)
        testQueue.flush()
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate, times: 2)
        mockDelegate.verify(.relaunch, times: 2)
        mockDelegate.never(.loadRemoteUpdate)
        mockDelegate.never(.throwException)
      }
      
      it("NewBrokenUpdateLoaded_UpdateAlreadyLaunchedSuccessfully") {
        let (testQueue, errorRecovery) = setUp()
        // if an update has already been launched successfully, we don't want to fall back to an older update
        
        let config = try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.never(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
        
        mockUpdate.successfulLaunchCount = 0
        let error2 = NSError(domain: "wat", code: 1)
        errorRecovery.handle(error: error2)
        testQueue.flush()
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.throwException)
        mockDelegate.never(.loadRemoteUpdate)
      }
      
      // TODO(eric): make these tests less flaky on CI and reenable them
      xit("RemoteLoadTimesOut") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
        mockDelegate.never(.throwException)
      }
      
      xit("RemoteLoadTimesOut_UpdateAlreadyLaunchedSuccessfully") {
        let (testQueue, errorRecovery) = setUp()
        // if an update has already been launched successfully, we don't want to fall back to an older update
        let config = try! UpdatesConfig.config(fromDictionary: [:])
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
        
        mockDelegate.verify(.throwException)
        mockDelegate.never(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.never(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
      }
      
      xit("RemoteLoadTimesOut_RCTContentDidAppear") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
            UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
            UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          ]),
          relaunchCompletionParams: (nil, true)
        )
        mockDelegate.remoteLoadStatus = .Loading
        errorRecovery.delegate = mockDelegate
        
        errorRecovery.startMonitoring()
        NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
        mockDelegate.verify(.markSuccessfulLaunchForLaunchedUpdate)
        
        // if RCTContentDidAppear has already fired, we don't want to roll back to an older update
        let error = NSError(domain: "wat", code: 1)
        errorRecovery.handle(error: error)
        
        // wait for more than 500ms
        Thread.sleep(forTimeInterval: 0.6)
        testQueue.flush()
        
        mockDelegate.verify(.throwException)
        mockDelegate.never(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.never(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
      }
      
      it("NoRemoteUpdate") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        // should try to load a remote update since we don't have one already
        mockDelegate.verify(.loadRemoteUpdate)
        
        // indicate there isn't a new update from the server
        errorRecovery.notify(newRemoteLoadStatus: .Idle)
        testQueue.flush()
        mockDelegate.verify(.relaunch)
      }
      
      it("NoRemoteUpdate_RCTContentDidAppear") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
            UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
            UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
          ]),
          relaunchCompletionParams: (nil, true)
        )
        mockDelegate.remoteLoadStatus = .Idle
        errorRecovery.delegate = mockDelegate
        
        errorRecovery.startMonitoring()
        NotificationCenter.default.post(name: NSNotification.Name.RCTContentDidAppear, object: nil)
        mockDelegate.verify(.markSuccessfulLaunchForLaunchedUpdate)
        
        let error = NSError(domain: "wat", code: 1)
        errorRecovery.handle(error: error)
        testQueue.flush()
        
        // should try to load a remote update since we don't have one already
        mockDelegate.verify(.loadRemoteUpdate)
        
        // indicate there isn't a new update from the server
        errorRecovery.notify(newRemoteLoadStatus: .Idle)
        testQueue.flush()
        mockDelegate.verify(.throwException)
      }
      
      it("CheckAutomaticallyNever") {
        let (testQueue, errorRecovery) = setUp()
        let config = try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
      }
      
      it("CheckAutomaticallyNever_RCTContentDidAppear") {
        let (testQueue, errorRecovery) = setUp()
        let config = try! UpdatesConfig.config(fromDictionary: [
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
        mockDelegate.verify(.markSuccessfulLaunchForLaunchedUpdate)
        
        let error = NSError(domain: "wat", code: 1)
        errorRecovery.handle(error: error)
        testQueue.flush()
        
        mockDelegate.verify(.throwException)
      }
    }
    
    describe("multiple errors") {
      it("handles two errors") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        mockDelegate.verify(.loadRemoteUpdate, times: 1)
      }
    }
    
    describe("exceptions") {
      it("handles exceptions") {
        let (testQueue, errorRecovery) = setUp()
        let mockDelegate = MockErrorRecoveryDelegate(
          config: try! UpdatesConfig.config(fromDictionary: [
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
        
        mockDelegate.verify(.markFailedLaunchForLaunchedUpdate)
        mockDelegate.verify(.relaunch)
        mockDelegate.never(.loadRemoteUpdate)
        mockDelegate.never(.throwException)
      }
    }
    
    describe("error log") {
      it("consume") {
        let logger = UpdatesLogger()
        let (testQueue, _) = setUp()
        // start with a clean slate
        _ = ErrorRecovery.consumeErrorLog(logger: logger)

        let error = NSError(domain: "TestDomain", code: 47, userInfo: [NSLocalizedDescriptionKey: "TestLocalizedDescription"])
        ErrorRecovery.writeErrorOrExceptionToLog(error, logger, dispatchQueue: testQueue)
        testQueue.flush()
        DispatchQueue.global().flush()

        let errorLog = ErrorRecovery.consumeErrorLog(logger: logger)
        expect(errorLog?.contains("TestDomain")) == true
        expect(errorLog?.contains("47")) == true
        expect(errorLog?.contains("TestLocalizedDescription")) == true
      }
      
      it("consume multiple errors") {
        let logger = UpdatesLogger()
        let (testQueue, _) = setUp()
        // start with a clean slate
        _ = ErrorRecovery.consumeErrorLog(logger: logger)

        let error = NSError(domain: "TestDomain", code: 47, userInfo: [NSLocalizedDescriptionKey: "TestLocalizedDescription"])
        ErrorRecovery.writeErrorOrExceptionToLog(error, logger, dispatchQueue: testQueue)

        let exception = NSException(name: NSExceptionName(rawValue: "TestName"), reason: "TestReason")
        ErrorRecovery.writeErrorOrExceptionToLog(exception, logger, dispatchQueue: testQueue)
        testQueue.flush()
        DispatchQueue.global().flush()

        let errorLog = ErrorRecovery.consumeErrorLog(logger: logger)
        expect(errorLog?.contains("TestDomain")) == true
        expect(errorLog?.contains("47")) == true
        expect(errorLog?.contains("TestLocalizedDescription")) == true
        expect(errorLog?.contains("TestName")) == true
        expect(errorLog?.contains("TestReason")) == true
      }
    }
  }
}
