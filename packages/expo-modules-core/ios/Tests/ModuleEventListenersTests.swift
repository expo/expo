// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

/// Resumes a continuation at most once.
///
/// The app-lifecycle tests below post to `NotificationCenter.default`, and every live `AppContext`
/// observes those names until it deallocates. A context belonging to another test (still alive
/// because the runner interleaves tests, or because its deallocation has not happened yet) therefore
/// also posts the event to its own registry and resumes this test's continuation a second time.
/// Resuming a `CheckedContinuation` twice traps, and the trap takes the whole test process with it,
/// which is what turned one stray notification into hundreds of unrelated failures in a bundle.
private final class ResumeOnce: @unchecked Sendable {
  private let continuation: CheckedContinuation<Void, Error>
  private let resumed = Mutex(false)

  init(_ continuation: CheckedContinuation<Void, Error>) {
    self.continuation = continuation
  }

  func resume() {
    let alreadyResumed = resumed.withLock { resumed -> Bool in
      let previous = resumed
      resumed = true
      return previous
    }
    if alreadyResumed {
      return
    }
    continuation.resume()
  }
}

/**
 This test suite covers module's event listeners which can listen to:
 - module's lifecycle events
 - app's lifecycle notifications
 - custom events sent to the module registry

 NOTE: Each test registers the module because only registered modules can capture events.

 Serialized so these tests don't overlap each other's notifications. `ResumeOnce` still guards each
 resume, because serialization orders the test bodies but does not bound the lifetime of an
 `AppContext` an earlier test left alive.
 */
@Suite("ModuleEventListeners", .serialized)
struct ModuleEventListenersTests {
  @Test
  func `calls OnCreate once the module instance is created`() async throws {
    let appContext = AppContext()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      _ = mockModuleHolder(appContext) {
        OnCreate {
          continuation.resume()
        }
      }
    }
  }

  @Test
  func `calls OnDestroy once the module is about to be deallocated`() async throws {
    var appContext = AppContext()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let moduleName = "mockedModule"
      let holder = mockModuleHolder(appContext) {
        Name(moduleName)
        OnDestroy {
          continuation.resume()
        }
      }
      appContext.moduleRegistry.register(holder: holder)
      // Unregister the module to deallocate its holder
      appContext.moduleRegistry.unregister(moduleName: holder.name)
      // The `module` object is actually still alive, but its holder is dead
    }
  }

  @Test
  func `calls OnAppContextDestroys once the context destroys`() async throws {
    var appContext: AppContext? = AppContext()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let holder = mockModuleHolder(appContext!) {
        OnAppContextDestroys {
          continuation.resume()
        }
      }
      appContext!.moduleRegistry.register(holder: holder)
      appContext = nil // This must deallocate the app context
    }
  }

  @Test
  func `calls custom event listener when the event is sent to the registry`() async throws {
    let appContext = AppContext()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let event = EventName.custom("custom event name")
      let holder = mockModuleHolder(appContext) {
        EventListener(event) {
          continuation.resume()
        }
      }
      appContext.moduleRegistry.register(holder: holder)
      appContext.moduleRegistry.post(event: event)
    }
  }

  @Test
  func `calls OnAppEntersForeground when system's willEnterForegroundNotification is sent`() async throws {
    let appContext = AppContext()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let once = ResumeOnce(continuation)
      let holder = mockModuleHolder(appContext) {
        OnAppEntersForeground {
          once.resume()
        }
      }
      appContext.moduleRegistry.register(holder: holder)
      NotificationCenter.default.post(name: UIApplication.willEnterForegroundNotification, object: nil)
    }
  }

  @Test
  func `calls OnAppBecomesActive when system's didBecomeActiveNotification is sent`() async throws {
    let appContext = AppContext()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let once = ResumeOnce(continuation)
      let holder = mockModuleHolder(appContext) {
        OnAppBecomesActive {
          once.resume()
        }
      }
      appContext.moduleRegistry.register(holder: holder)
      NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
    }
  }

  @Test
  func `calls OnAppEntersBackground when system's didEnterBackgroundNotification is sent`() async throws {
    let appContext = AppContext()

    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      let once = ResumeOnce(continuation)
      let holder = mockModuleHolder(appContext) {
        OnAppEntersBackground {
          once.resume()
        }
      }
      appContext.moduleRegistry.register(holder: holder)
      NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: nil)
    }
  }
}
