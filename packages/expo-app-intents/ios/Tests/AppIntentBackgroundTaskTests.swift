import ExpoModulesCore
import Foundation
import Testing

@testable import ExpoAppIntents

@Suite("AppIntentDispatcher.runBackgroundTask")
struct AppIntentBackgroundTaskTests {
  @Test
  func `passes the invocation to the task and returns its converted result`() async throws {
    let defaults = try #require(UserDefaults(suiteName: #function))
    defaults.removePersistentDomain(forName: #function)
    let runner = FakeTaskRunner(behavior: .resolve(["message": "Logged 250 ml.", "total": NSNumber(value: 1250.0)]))
    let dispatcher = AppIntentDispatcher(
      store: try #require(AppIntentInvocationStore(userDefaultsSuiteName: #function)),
      taskRunner: runner
    )

    let result = try await dispatcher.runBackgroundTask(
      name: "log-water",
      params: ["amount": 250],
      timeout: .milliseconds(12_500)
    )

    #expect(result == .object(["message": .string("Logged 250 ml."), "total": .int(1250)]))
    let call = try #require(runner.calls.first)
    #expect(call.taskName == "log-water")
    #expect(call.timeout == 12.5)
    #expect(call.data["name"] as? String == "log-water")
    #expect((call.data["params"] as? [String: Any])?["amount"] as? Int == 250)
    #expect(call.data["id"] is String)
    // The task is the handler of the invocation, so nothing is left for `useAppIntents`.
    #expect(try await dispatcher.pendingInvocations().isEmpty)
  }

  @Test
  func `rethrows the error the runner reported`() async throws {
    let runnerError = NSError(domain: "test", code: 1, userInfo: [NSLocalizedDescriptionKey: "Disk is full."])
    let dispatcher = AppIntentDispatcher(
      store: AppIntentInvocationStore(),
      taskRunner: FakeTaskRunner(behavior: .reject(runnerError))
    )

    let error = await #expect(throws: (any Error).self) {
      try await dispatcher.runBackgroundTask(name: "log-water")
    }
    #expect(error?.localizedDescription == "Disk is full.")
  }

  @Test
  func `throws a clear error when expo-task-manager is not installed`() async throws {
    let dispatcher = AppIntentDispatcher(store: AppIntentInvocationStore(), taskRunner: nil)

    let error = await #expect(throws: BackgroundTaskUnavailableException.self) {
      try await dispatcher.runBackgroundTask(name: "log-water")
    }
    let message = try #require(error?.localizedDescription)
    #expect(message.contains("'log-water'"))
    #expect(message.contains("npx expo install expo-task-manager"))
  }

  @Test
  func `stops waiting when the calling task is cancelled`() async throws {
    let runner = FakeTaskRunner(behavior: .hold)
    let dispatcher = AppIntentDispatcher(store: AppIntentInvocationStore(), taskRunner: runner)

    let run = Task {
      try await dispatcher.runBackgroundTask(name: "slow")
    }
    #expect(await waitUntil { runner.calls.count == 1 }, "expected the runner to be called")
    run.cancel()

    await #expect(throws: CancellationError.self) {
      try await run.value
    }
    // A runner that answers after the caller gave up must not resume the caller a second time.
    runner.completeHeldRuns(result: "late")
  }

  /// Polls until `condition` holds, so a run that never reaches the runner fails instead of hanging.
  private func waitUntil(_ condition: @Sendable () -> Bool) async -> Bool {
    let deadline = DispatchTime.now().uptimeNanoseconds + 2_000_000_000
    while DispatchTime.now().uptimeNanoseconds < deadline {
      if condition() {
        return true
      }
      try? await Task.sleep(nanoseconds: 10_000_000)
    }
    return condition()
  }
}

private final class FakeTaskRunner: NSObject, EXTaskRunnerInterface, @unchecked Sendable {
  enum Behavior {
    case resolve(Any?)
    case reject(any Error)
    case hold
  }

  struct Call {
    let taskName: String
    let data: [AnyHashable: Any]
    let timeout: TimeInterval
  }

  private let behavior: Behavior
  private let lock = NSLock()
  private var recordedCalls: [Call] = []
  private var heldCompletions: [@Sendable (Any?, (any Error)?) -> Void] = []

  init(behavior: Behavior) {
    self.behavior = behavior
  }

  var calls: [Call] {
    lock.withLock { recordedCalls }
  }

  func runTask(
    withName taskName: String,
    data: [AnyHashable: Any],
    timeout: TimeInterval,
    completionHandler: @escaping @Sendable (Any?, (any Error)?) -> Void
  ) {
    lock.withLock {
      recordedCalls.append(Call(taskName: taskName, data: data, timeout: timeout))
    }
    switch behavior {
    case .resolve(let result):
      completionHandler(result, nil)
    case .reject(let error):
      completionHandler(nil, error)
    case .hold:
      lock.withLock {
        heldCompletions.append(completionHandler)
      }
    }
  }

  func completeHeldRuns(result: Any?) {
    let completions = lock.withLock { heldCompletions }
    for completion in completions {
      completion(result, nil)
    }
  }
}
