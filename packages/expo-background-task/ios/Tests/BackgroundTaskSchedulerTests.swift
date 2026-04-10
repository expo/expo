import BackgroundTasks
import XCTest

@testable import ExpoBackgroundTask

final class BackgroundTaskSchedulerTests: XCTestCase {
  override func tearDown() {
    BackgroundTaskScheduler.resetForTesting()
    super.tearDown()
  }

  func testConcurrentScheduleWorkerCallsDoNotOverlapCancel() async throws {
    let scheduler = OverlapDetectingScheduler()

    BackgroundTaskScheduler.setSchedulerForTesting(scheduler)
    BackgroundTaskScheduler.resetForTesting(registeredTaskCount: 1)
    BackgroundTaskScheduler.setSchedulerForTesting(scheduler)
    BackgroundTaskScheduler.bgTaskSchedulerDidFinishRegister()

    async let first: Void = BackgroundTaskScheduler.tryScheduleWorker()
    async let second: Void = BackgroundTaskScheduler.tryScheduleWorker()

    try await first
    try await second

    XCTAssertEqual(scheduler.maxConcurrentCancelCalls, 1)
    XCTAssertEqual(scheduler.submitCallCount, 2)
  }
}

private final class OverlapDetectingScheduler: BackgroundTaskScheduling {
  private let lock = NSLock()
  private var activeCancelCalls = 0

  private(set) var maxConcurrentCancelCalls = 0
  private(set) var submitCallCount = 0

  func cancel(taskRequestWithIdentifier identifier: String) {
    lock.lock()
    activeCancelCalls += 1
    maxConcurrentCancelCalls = max(maxConcurrentCancelCalls, activeCancelCalls)
    lock.unlock()

    Thread.sleep(forTimeInterval: 0.05)

    lock.lock()
    activeCancelCalls -= 1
    lock.unlock()
  }

  func submit(_ request: BGProcessingTaskRequest) throws {
    lock.lock()
    submitCallCount += 1
    lock.unlock()
  }

  func pendingTaskRequests() async -> [BGTaskRequest] {
    return []
  }
}
