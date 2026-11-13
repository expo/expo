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

  func testOmittingRequiresNetworkConnectivityKeepsItRequired() async throws {
    let scheduler = try await submitRequest(requiresNetworkConnectivity: nil)

    XCTAssertEqual(scheduler.submittedRequests.count, 1)
    XCTAssertEqual(scheduler.submittedRequests.last?.requiresNetworkConnectivity, true)
  }

  func testRequiresNetworkConnectivityTrueKeepsItRequired() async throws {
    let scheduler = try await submitRequest(requiresNetworkConnectivity: true)

    XCTAssertEqual(scheduler.submittedRequests.last?.requiresNetworkConnectivity, true)
  }

  func testRequiresNetworkConnectivityFalseSubmitsRequestWithoutIt() async throws {
    let scheduler = try await submitRequest(requiresNetworkConnectivity: false)

    XCTAssertEqual(scheduler.submittedRequests.last?.requiresNetworkConnectivity, false)
  }

  func testRequiresNetworkConnectivityDoesNotLeakBetweenRegistrations() async throws {
    let scheduler = RequestCapturingScheduler()

    await BackgroundTaskScheduler.resetForTesting()
    await BackgroundTaskScheduler.setSchedulerForTesting(scheduler)
    BackgroundTaskScheduler.bgTaskSchedulerDidFinishRegister()
    _ = await BackgroundTaskScheduler.didRegisterTaskForTesting(
      minutes: nil,
      requiresNetworkConnectivity: false
    )
    try await BackgroundTaskScheduler.tryScheduleWorker()

    await BackgroundTaskScheduler.resetForTesting()
    await BackgroundTaskScheduler.setSchedulerForTesting(scheduler)
    _ = await BackgroundTaskScheduler.didRegisterTaskForTesting(
      minutes: nil,
      requiresNetworkConnectivity: nil
    )
    try await BackgroundTaskScheduler.tryScheduleWorker()

    XCTAssertEqual(scheduler.submittedRequests.count, 2)
    XCTAssertEqual(scheduler.submittedRequests.first?.requiresNetworkConnectivity, false)
    XCTAssertEqual(scheduler.submittedRequests.last?.requiresNetworkConnectivity, true)
  }

  private func submitRequest(requiresNetworkConnectivity: Bool?) async throws -> RequestCapturingScheduler {
    let scheduler = RequestCapturingScheduler()

    await BackgroundTaskScheduler.resetForTesting()
    await BackgroundTaskScheduler.setSchedulerForTesting(scheduler)
    BackgroundTaskScheduler.bgTaskSchedulerDidFinishRegister()

    _ = await BackgroundTaskScheduler.didRegisterTaskForTesting(
      minutes: nil,
      requiresNetworkConnectivity: requiresNetworkConnectivity
    )
    try await BackgroundTaskScheduler.tryScheduleWorker()

    return scheduler
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

private final class RequestCapturingScheduler: BackgroundTaskScheduling, @unchecked Sendable {
  private let lock = NSLock()
  private var requests: [BGProcessingTaskRequest] = []

  var submittedRequests: [BGProcessingTaskRequest] {
    lock.lock()
    defer { lock.unlock() }
    return requests
  }

  func cancel(taskRequestWithIdentifier identifier: String) {}

  func submit(_ request: BGProcessingTaskRequest) throws {
    lock.lock()
    requests.append(request)
    lock.unlock()
  }

  func pendingTaskRequests() async -> [BGTaskRequest] {
    return []
  }
}
