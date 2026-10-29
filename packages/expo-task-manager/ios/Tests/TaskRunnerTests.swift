import ExpoModulesCore
import XCTest

@testable import ExpoTaskManager

/// Runs tasks through the real `EXTaskService`, under an app ID of its own, with a task manager that
/// stands in for JavaScript: it records the events the service hands over, and each test answers them
/// the way `TaskManager` does, with `notifyTask(withName:forAppId:didFinishWithResponse:)`.
@MainActor
final class TaskRunnerTests: XCTestCase {
  // XCTest creates an instance for every test, so each test gets an app ID and a task manager of its own.
  private let appId = "TaskRunnerTests-\(UUID().uuidString)"
  private let service = EXTaskService.shared
  private let taskManager = RecordingTaskManager()
  private lazy var runs = OnDemandTaskRuns(appId: appId)

  override func setUp() async throws {
    try await super.setUp()
    service.setTaskManager(taskManager, forAppId: appId, withUrl: nil)
  }

  override func tearDown() async throws {
    service.unregisterAllTasks(forAppId: appId)
    try await super.tearDown()
  }

  func testRegistersTheTaskOnTheFirstRunAndCompletesWithItsResult() throws {
    let outcome = expectOutcome(of: "log-water", data: ["amount": 250])

    XCTAssertTrue(service.task(withName: "log-water", forAppId: appId, hasConsumerOf: OnDemandTaskConsumer.self))
    let body = try XCTUnwrap(taskManager.bodies.first)
    XCTAssertEqual((body["data"] as? [String: Any])?["amount"] as? Int, 250)
    try answer(event: 0, with: ["result": "Logged 250 ml."])

    wait(for: [outcome.expectation], timeout: 2)
    XCTAssertEqual(outcome.result as? String, "Logged 250 ml.")
    XCTAssertNil(outcome.error)
  }

  func testResolvesOverlappingRunsOfOneTaskByEvent() throws {
    let first = expectOutcome(of: "log-water")
    let second = expectOutcome(of: "log-water")

    try answer(event: 1, with: ["result": NSNull()])
    try answer(event: 0, with: ["result": "first"])

    wait(for: [first.expectation, second.expectation], timeout: 2)
    XCTAssertEqual(first.result as? String, "first")
    XCTAssertNil(second.result)
    XCTAssertNil(second.error)
  }

  func testFailsWithTheErrorJavaScriptReported() throws {
    let threw = expectOutcome(of: "log-water")
    let notDefined = expectOutcome(of: "log-water")

    try answer(event: 0, with: ["error": ["code": "ERR_TASK_EXECUTION_FAILED", "message": "Disk is full."]])
    try answer(event: 1, with: ["error": ["code": "ERR_TASK_NOT_DEFINED", "message": "Not defined."]])

    wait(for: [threw.expectation, notDefined.expectation], timeout: 2)
    let threwMessage = try XCTUnwrap(threw.error?.localizedDescription)
    XCTAssertTrue(threwMessage.contains("Disk is full."), threwMessage)
    let notDefinedMessage = try XCTUnwrap(notDefined.error?.localizedDescription)
    XCTAssertTrue(notDefinedMessage.contains("TaskManager.defineTask('log-water'"), notDefinedMessage)
  }

  func testRejectsANameRegisteredWithAnotherConsumer() throws {
    service.registerTask(withName: "sync", appId: appId, appUrl: nil, consumerClass: OtherConsumer.self, options: nil)
    let registered = service.getOrRegisterTask(
      withName: "sync",
      appId: appId,
      appUrl: nil,
      consumerClass: OtherConsumer.self,
      options: nil
    )
    let owner = try XCTUnwrap(registered.consumer as? OtherConsumer)
    let outcome = expectOutcome(of: "sync")

    wait(for: [outcome.expectation], timeout: 2)
    let message = try XCTUnwrap(outcome.error?.localizedDescription)
    XCTAssertTrue(message.contains("'other'"), message)
    XCTAssertTrue(service.task(withName: "sync", forAppId: appId, hasConsumerOf: OtherConsumer.self))
    XCTAssertEqual(owner.unregisterCount, 0)
    XCTAssertTrue(taskManager.bodies.isEmpty)
  }

  func testFailsWhenTheTaskDoesNotFinishInTimeAndIgnoresALateResponse() throws {
    let outcome = expectOutcome(of: "log-water", timeout: 0.05)
    wait(for: [outcome.expectation], timeout: 2)

    try answer(event: 0, with: ["result": "late"])
    drainMainQueue()

    let message = try XCTUnwrap(outcome.error?.localizedDescription)
    XCTAssertTrue(message.contains("did not finish"), message)
    XCTAssertEqual(outcome.completionCount, 1)
  }

  func testFailsWaitingRunsWhenTheTaskIsUnregisteredAndRegistersItAgain() throws {
    let first = expectOutcome(of: "log-water")
    service.unregisterTask(withName: "log-water", forAppId: appId, consumerClass: nil)
    wait(for: [first.expectation], timeout: 2)
    let message = try XCTUnwrap(first.error?.localizedDescription)
    XCTAssertTrue(message.contains("unregistered"), message)

    let second = expectOutcome(of: "log-water")
    try answer(event: 1, with: ["result": "again"])

    wait(for: [second.expectation], timeout: 2)
    XCTAssertEqual(second.result as? String, "again")
  }

  // MARK: - Helpers

  private func expectOutcome(
    of taskName: String,
    data: [AnyHashable: Any] = [:],
    timeout: TimeInterval = 5
  ) -> RunOutcome {
    let outcome = RunOutcome(expectation: expectation(description: "run of '\(taskName)' completes"))
    runs.run(taskName: taskName, data: data, timeout: timeout) { result, error in
      outcome.record(result: result, error: error)
    }
    return outcome
  }

  /// Answers the event at `index`, in the order the service handed events over, as `TaskManager` does.
  private func answer(event index: Int, with response: [String: Any]) throws {
    let body = try XCTUnwrap(taskManager.bodies[safe: index], "no event at index \(index)")
    let info = executionInfo(of: body)
    let eventId = try XCTUnwrap(info["eventId"] as? String)
    let taskName = try XCTUnwrap(info["taskName"] as? String)
    service.notifyTask(
      withName: taskName,
      forAppId: appId,
      didFinishWithResponse: response.merging(["eventId": eventId]) { current, _ in current }
    )
  }

  private func executionInfo(of body: [String: Any]) -> [String: Any] {
    return body["executionInfo"] as? [String: Any] ?? [:]
  }

  /// Responses reach the runner through the main queue, so this lets every one queued so far arrive.
  private func drainMainQueue() {
    let drained = expectation(description: "main queue drained")
    DispatchQueue.main.async {
      drained.fulfill()
    }
    wait(for: [drained], timeout: 2)
  }
}

private final class RunOutcome {
  let expectation: XCTestExpectation
  private(set) var result: Any?
  private(set) var error: Error?
  private(set) var completionCount = 0

  init(expectation: XCTestExpectation) {
    self.expectation = expectation
  }

  func record(result: Any?, error: Error?) {
    self.result = result
    self.error = error
    completionCount += 1
    expectation.fulfill()
  }
}

private final class OtherConsumer: NSObject, EXTaskConsumerInterface {
  var task: EXTaskInterface?
  private(set) var unregisterCount = 0

  func taskType() -> String {
    return "other"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
  }

  func didUnregister() {
    unregisterCount += 1
  }
}

private final class RecordingTaskManager: NSObject, EXTaskManagerInterface {
  private(set) var bodies: [[String: Any]] = []

  func hasRegisteredTask(withName taskName: String) -> Bool {
    return false
  }

  func task(withName taskName: String, hasConsumerOf consumerClass: AnyClass) -> Bool {
    return false
  }

  func registerTask(withName taskName: String, consumer consumerClass: AnyClass, options: [AnyHashable: Any]) {}

  func unregisterTask(withName taskName: String, consumerClass: AnyClass?) {}

  func hasBackgroundModeEnabled(_ backgroundMode: String) -> Bool {
    return false
  }

  func execute(withBody body: [String: Any]) {
    bodies.append(body)
  }

  func isRunningInHeadlessMode() -> Bool {
    return false
  }
}

extension Array {
  fileprivate subscript(safe index: Int) -> Element? {
    return indices.contains(index) ? self[index] : nil
  }
}
