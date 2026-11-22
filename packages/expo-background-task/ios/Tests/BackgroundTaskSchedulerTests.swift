import BackgroundTasks
import XCTest

@testable import ExpoBackgroundTask

final class BackgroundTaskSchedulerTests: XCTestCase {
  override func tearDown() async throws {
    await BackgroundTaskScheduler.resetForTesting()
    try await super.tearDown()
  }

  func testTaskServiceHelperResolvesSharedTaskService() {
    XCTAssertNotNil(EXTaskServiceHelper.sharedTaskService())
  }

  func testConcurrentScheduleWorkerCallsDoNotOverlapCancel() async throws {
    let scheduler = OverlapDetectingScheduler()

    await BackgroundTaskScheduler.resetForTesting(registeredTaskCount: 1)
    await BackgroundTaskScheduler.setSchedulerForTesting(scheduler)
    BackgroundTaskScheduler.bgTaskSchedulerDidFinishRegister()

    async let first: Void = BackgroundTaskScheduler.tryScheduleWorker()
    async let second: Void = BackgroundTaskScheduler.tryScheduleWorker()

    try await first
    try await second

    XCTAssertEqual(scheduler.maxConcurrentCancelCalls, 1)
    XCTAssertEqual(scheduler.submitCallCount, 2)
  }

  func testMinimumIntervalRegisteredFromJSIsRead() {
    // A number passed to registerTaskAsync reaches native code as a Double.
    let options: [AnyHashable: Any] = ["minimumInterval": Double(15)]
    XCTAssertEqual(BackgroundTaskConsumer.minimumIntervalMinutes(from: options), 15)
  }

  func testMinimumIntervalRestoredFromSavedConfigIsRead() {
    // The saved task config comes back from NSUserDefaults with NSNumber values.
    // swiftlint:disable:next legacy_objc_type
    let options: [AnyHashable: Any] = ["minimumInterval": NSNumber(value: 15)]
    XCTAssertEqual(BackgroundTaskConsumer.minimumIntervalMinutes(from: options), 15)
  }

  func testMissingMinimumIntervalKeepsTheDefault() {
    XCTAssertNil(BackgroundTaskConsumer.minimumIntervalMinutes(from: nil))
    XCTAssertNil(BackgroundTaskConsumer.minimumIntervalMinutes(from: [:]))
  }

  func testRegisteringWithMinutesSchedulesTheWorkerAfterThatInterval() async throws {
    let scheduler = RequestCapturingScheduler()
    let submitted = expectation(description: "worker submitted")
    scheduler.onSubmit = { submitted.fulfill() }

    await BackgroundTaskScheduler.resetForTesting()
    await BackgroundTaskScheduler.setSchedulerForTesting(scheduler)
    BackgroundTaskScheduler.bgTaskSchedulerDidFinishRegister()

    let start = Date()
    BackgroundTaskScheduler.didRegisterTask(minutes: 15)
    await fulfillment(of: [submitted], timeout: 5)

    let delay = try XCTUnwrap(scheduler.lastRequest?.earliestBeginDate).timeIntervalSince(start)
    XCTAssertEqual(delay, 15 * 60, accuracy: 5)
  }
}

private final class RequestCapturingScheduler: BackgroundTaskScheduling, @unchecked Sendable {
  private let lock = NSLock()
  private var request: BGProcessingTaskRequest?
  var onSubmit: (() -> Void)?

  var lastRequest: BGProcessingTaskRequest? {
    lock.lock()
    defer { lock.unlock() }
    return request
  }

  func cancel(taskRequestWithIdentifier identifier: String) {}

  func submit(_ request: BGProcessingTaskRequest) throws {
    lock.lock()
    self.request = request
    lock.unlock()
    onSubmit?()
  }

  func pendingTaskRequests() async -> [BGTaskRequest] {
    return []
  }
}

private final class OverlapDetectingScheduler: BackgroundTaskScheduling, @unchecked Sendable {
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
