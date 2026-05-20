// Copyright 2022-present 650 Industries. All rights reserved.

import Testing

@testable import ExpoModulesCore

/**
 This test suite covers module's event listeners which can listen to:
 - module's lifecycle events
 - app's lifecycle notifications
 - custom events sent to the module registry

 NOTE: Each test registers the module because only registered modules can capture events.
 */
@Suite("ModuleEventListeners")
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
      let holder = mockModuleHolder(appContext) {
        OnAppEntersForeground {
          continuation.resume()
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
      let holder = mockModuleHolder(appContext) {
        OnAppBecomesActive {
          continuation.resume()
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
      let holder = mockModuleHolder(appContext) {
        OnAppEntersBackground {
          continuation.resume()
        }
      }
      appContext.moduleRegistry.register(holder: holder)
      NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: nil)
    }
  }
}
