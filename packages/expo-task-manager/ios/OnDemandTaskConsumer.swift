// Copyright 2026-present 650 Industries. All rights reserved.
import ExpoModulesCore

/**
 The consumer of tasks that native code runs on demand with `TaskRunner`.
 */
@objc(EXOnDemandTaskConsumer)
final class OnDemandTaskConsumer: NSObject, EXTaskResponseConsumer, @unchecked Sendable {
  /// Guarded, because `EXTaskService` sets and clears it on the threads that register and unregister the task.
  private let taskStorage = Mutex<EXTaskInterface?>(nil)

  var task: EXTaskInterface? {
    get {
      return taskStorage.withLock { $0 }
    }
    set {
      taskStorage.withLock { $0 = newValue }
    }
  }

  /// Called on the main thread with every response that JavaScript reports for this task.
  @MainActor var onFinish: ((_ response: [AnyHashable: Any]) -> Void)?

  /// Called on the main thread after the task is unregistered.
  @MainActor var onUnregister: (() -> Void)?

  // MARK: - EXTaskConsumerInterface

  func taskType() -> String {
    return "onDemandTask"
  }

  func didRegisterTask(_ task: EXTaskInterface) {
    self.task = task
  }

  func didUnregister() {
    task = nil

    // `EXTaskService` calls this on the thread that unregistered the task, often the JavaScript thread.
    // The main queue keeps it in order with responses that were reported before it.
    DispatchQueue.main.async {
      MainActor.assumeIsolated {
        self.onUnregister?()
      }
    }
  }

  // MARK: - EXTaskResponseConsumer

  func didFinishEvent(withResponse response: [AnyHashable: Any]) {
    // Reported on the thread of the `notifyTaskFinishedAsync` call from JavaScript. Only the main thread
    // uses the response from here on.
    nonisolated(unsafe) let response = response
    DispatchQueue.main.async {
      MainActor.assumeIsolated {
        self.onFinish?(response)
      }
    }
  }
}
