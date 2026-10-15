//  Copyright (c) 2026 650 Industries, Inc. All rights reserved.

import Testing
import Foundation

@testable import EXUpdates

// Simulates a cold start where the cached update cannot launch and the
// remote check finds nothing new, without touching the network.
private final class FailingLaunchLoaderTask: AppLoaderTask {
  static let brokenUpdateId = UUID()

  override func loadEmbeddedUpdate(withCompletion completion: @escaping () -> Void) {
    completion()
  }

  override func launch(withCompletion completion: @escaping (_ error: UpdatesError?, _ success: Bool) -> Void) {
    completion(UpdatesError.appLauncherLaunchAssetNotFound(updateId: Self.brokenUpdateId), false)
  }

  override func loadRemoteUpdate(withCompletion completion: @escaping (_ remoteError: UpdatesError?, _ updateResponse: UpdateResponse?) -> Void) {
    completion(nil, nil)
  }
}

private final class ErrorRecordingDelegate: AppLoaderTaskDelegate {
  private let onError: (Error) -> Void

  init(onError: @escaping (Error) -> Void) {
    self.onError = onError
  }

  func appLoaderTask(_: AppLoaderTask, didLoadCachedUpdate update: Update) -> Bool {
    true
  }
  func appLoaderTask(_: AppLoaderTask, didStartLoadingUpdate update: Update?) {}
  func appLoaderTask(_: AppLoaderTask, didFinishWithLauncher launcher: AppLauncher, isUpToDate: Bool) {}
  func appLoaderTask(_: AppLoaderTask, didFinishWithError error: Error) {
    onError(error)
  }
  func appLoaderTask(
    _: AppLoaderTask,
    didFinishBackgroundUpdateWithStatus status: BackgroundUpdateStatus,
    update: Update?,
    error: Error?
  ) {}
  func appLoaderTaskDidFinishAllLoading(_: AppLoaderTask) {}
}

@Suite("AppLoaderTask", .serialized)
class AppLoaderTaskTests {
  var testDatabaseDir: URL
  var db: UpdatesDatabase

  init() throws {
    let applicationSupportDir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask).last
    testDatabaseDir = applicationSupportDir!.appendingPathComponent("AppLoaderTaskTests")

    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)

    if !FileManager.default.fileExists(atPath: testDatabaseDir.path) {
      try FileManager.default.createDirectory(atPath: testDatabaseDir.path, withIntermediateDirectories: true)
    }

    db = UpdatesDatabase()
    db.databaseQueue.sync {
      try! db.openDatabase(inDirectory: testDatabaseDir, logger: UpdatesLogger())
    }
  }

  deinit {
    db.databaseQueue.sync {
      db.closeDatabase()
    }
    try? FileManager.default.removeItem(atPath: testDatabaseDir.path)
  }

  @Test
  func `reports the launcher failure instead of the generic error`() async throws {
    let config = try UpdatesConfig.config(fromDictionary: [
      UpdatesConfig.EXUpdatesConfigUpdateUrlKey: "https://example.com",
      UpdatesConfig.EXUpdatesConfigScopeKeyKey: "dummyScope",
      UpdatesConfig.EXUpdatesConfigRuntimeVersionKey: "1",
      UpdatesConfig.EXUpdatesConfigHasEmbeddedUpdateKey: false,
    ])

    let task = FailingLaunchLoaderTask(
      withConfig: config,
      database: db,
      directory: testDatabaseDir,
      selectionPolicy: SelectionPolicyFactory.filterAwarePolicy(withRuntimeVersion: "1", config: config),
      delegateQueue: DispatchQueue(label: "AppLoaderTaskTests.delegate"),
      logger: UpdatesLogger()
    )

    final class Once: @unchecked Sendable {
      private var done = false
      private let lock = NSLock()
      func run(_ block: () -> Void) {
        lock.lock()
        defer { lock.unlock() }
        if !done {
          done = true
          block()
        }
      }
    }

    let once = Once()
    var strongDelegate: ErrorRecordingDelegate?
    let receivedError: Error? = await withCheckedContinuation { continuation in
      let delegate = ErrorRecordingDelegate { error in
        once.run { continuation.resume(returning: error) }
      }
      strongDelegate = delegate
      task.delegate = delegate
      task.start()
      DispatchQueue.global().asyncAfter(deadline: .now() + 10.0) {
        once.run { continuation.resume(returning: nil) }
      }
    }
    withExtendedLifetime(strongDelegate) {}

    #expect(receivedError != nil, "the loader task never reported an error")

    guard let updatesError = receivedError as? UpdatesError else {
      Issue.record("Expected an UpdatesError but got \(String(describing: receivedError))")
      return
    }

    guard case .appLoaderTaskFailedToLaunch = updatesError else {
      Issue.record("Expected appLoaderTaskFailedToLaunch but got \(updatesError)")
      return
    }
  }
}
