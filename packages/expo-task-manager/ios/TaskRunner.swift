// Copyright 2026-present 650 Industries. All rights reserved.
import ExpoModulesCore

/**
 Runs a JavaScript task defined with `TaskManager.defineTask` on demand, in the execution time of the
 caller, and reports the value the task resolved with.

 Other modules can find this class with `NSClassFromString("EXTaskRunner")` and use it through
 `EXTaskRunnerInterface`.
 */
@objc(EXTaskRunner)
public final class TaskRunner: NSObject, EXTaskRunnerInterface {
  public func runTask(
    withName taskName: String,
    data: [AnyHashable: Any],
    timeout: TimeInterval,
    completionHandler: @escaping @Sendable (Any?, Error?) -> Void
  ) {
    // Only the main thread uses the data from here on.
    nonisolated(unsafe) let data = data
    DispatchQueue.main.async {
      MainActor.assumeIsolated {
        OnDemandTaskRuns.shared.run(taskName: taskName, data: data, timeout: timeout, completion: completionHandler)
      }
    }
  }
}

/**
 The on-demand runs that wait for a response from JavaScript, keyed by the event ID that the response
 carries. Keying by event lets overlapping runs of one task each get their own result.
 */
@MainActor
final class OnDemandTaskRuns {
  typealias Completion = (Any?, Error?) -> Void

  /// Uses the app ID that `TaskManagerModule` registers tasks for. Outside Expo Go there is only this one.
  static let shared = OnDemandTaskRuns(appId: "mainApplication")

  private struct Run {
    let taskName: String
    let consumerId: ObjectIdentifier
    let completion: Completion
    let timeout: DispatchWorkItem
  }

  private let appId: String
  private let service = EXTaskService.shared
  private var runs: [String: Run] = [:]

  init(appId: String) {
    self.appId = appId
  }

  func run(taskName: String, data: [AnyHashable: Any], timeout: TimeInterval, completion: @escaping Completion) {
    let task: EXTaskInterface
    let consumer: OnDemandTaskConsumer
    do {
      guard timeout.isFinite, timeout > 0 else {
        throw OnDemandTaskException.invalidTimeout(taskName, timeout: timeout)
      }
      (task, consumer) = try registeredTask(named: taskName)
    } catch {
      completion(nil, error)
      return
    }

    let eventId = service.executeTask(task, withData: data, withError: nil)
    // Responses come through the main queue, so none can arrive before the run is stored.
    let timeoutItem = DispatchWorkItem { [weak self] in
      MainActor.assumeIsolated {
        self?.complete(eventId: eventId, result: nil, error: OnDemandTaskException.timedOut(taskName, timeout: timeout))
      }
    }
    runs[eventId] = Run(
      taskName: taskName,
      consumerId: ObjectIdentifier(consumer),
      completion: completion,
      timeout: timeoutItem
    )
    DispatchQueue.main.asyncAfter(deadline: .now() + timeout, execute: timeoutItem)
  }

  /// Returns the task and its consumer, registering the task first when it is not registered yet.
  private func registeredTask(named taskName: String) throws -> (EXTaskInterface, OnDemandTaskConsumer) {
    guard !taskName.isEmpty else {
      throw OnDemandTaskException.invalidName()
    }
    // Never replaces another task with this name, even one registered concurrently. The registration
    // persists, so JavaScript never has to register the task itself.
    let task = service.getOrRegisterTask(
      withName: taskName,
      appId: appId,
      appUrl: nil,
      consumerClass: OnDemandTaskConsumer.self,
      options: [:]
    )
    guard let consumer = task.consumer as? OnDemandTaskConsumer else {
      throw OnDemandTaskException.nameTaken(taskName, taskType: task.consumer.taskType())
    }
    let consumerId = ObjectIdentifier(consumer)
    consumer.onFinish = { [weak self] response in
      self?.didFinish(response: response)
    }
    consumer.onUnregister = { [weak self] in
      self?.didUnregister(consumerId: consumerId)
    }
    return (task, consumer)
  }

  private func didFinish(response: [AnyHashable: Any]) {
    // A response for an unknown event belongs to a run that already timed out.
    guard let eventId = response["eventId"] as? String, let run = runs[eventId] else {
      return
    }
    if let error = response["error"] as? [String: Any] {
      let failure = OnDemandTaskException.failed(
        run.taskName,
        code: error["code"] as? String,
        message: error["message"] as? String
      )
      complete(eventId: eventId, result: nil, error: failure)
      return
    }
    let result = response["result"]
    complete(eventId: eventId, result: result is NSNull ? nil : result, error: nil)
  }

  /// Fails the runs of a consumer that was unregistered, because no response for them can arrive.
  private func didUnregister(consumerId: ObjectIdentifier) {
    for (eventId, run) in runs where run.consumerId == consumerId {
      complete(eventId: eventId, result: nil, error: OnDemandTaskException.unregistered(run.taskName))
    }
  }

  private func complete(eventId: String, result: Any?, error: Error?) {
    guard let run = runs.removeValue(forKey: eventId) else {
      return
    }
    run.timeout.cancel()
    run.completion(result, error)
  }
}
