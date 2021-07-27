import XCTest

@testable import ExpoModulesCore

/**
 This test case covers module's event listeners which can listen to:
 - module's lifecycle events
 - app's lifecycle notifications
 - custom events sent to the module registry

 NOTE: Each test registers the module because only registered modules can capture events.
 */
class ModuleEventListenersTests: XCTestCase {
  var appContext: AppContext!

  override func setUp() {
    appContext = AppContext()
  }

  func testOnCreate() {
    let expect = expectation(description: "onCreate is called once the module registers in the registry")
    let module = CustomModule(appContext: appContext) {
      $0.onCreate {
        expect.fulfill()
      }
    }
    appContext.moduleRegistry.register(module: module)
    waitForExpectations(timeout: 0)
  }

  func testOnDestroy() {
    let expect = expectation(description: "onDestroy is called when the module is about to be deallocated")
    let module = CustomModule(appContext: appContext) {
      $0.onDestroy {
        expect.fulfill()
      }
    }
    appContext.moduleRegistry.register(module: module)
    // Unregister the module to deallocate its holder
    appContext.moduleRegistry.unregister(module: module)
    // The `module` object is actually still alive, but its holder is dead
    waitForExpectations(timeout: 0)
  }

  func testOnAppContextDestroys() {
    let expect = expectation(description: "onAppContextDestroys is called once the context destroys")
    let module = CustomModule(appContext: appContext) {
      $0.onAppContextDestroys {
        expect.fulfill()
      }
    }
    appContext.moduleRegistry.register(module: module)
    self.appContext = nil // This must deallocate the app context
    waitForExpectations(timeout: 0)
  }

  func testOnCustomEvent() {
    let expect = expectation(description: "custom event listener is called when the event is sent to the registry")
    let event = EventName.custom("custom event name")
    let module = CustomModule(appContext: appContext) { _ in
      EventListener(event) {
        expect.fulfill()
      }
    }
    appContext.moduleRegistry.register(module: module)
    appContext.moduleRegistry.post(event: event)
    waitForExpectations(timeout: 0)
  }

  func testOnAppEntersForeground() {
    let expect = expectation(description: "onAppEntersForeground is called when system's willEnterForegroundNotification is sent")
    let module = CustomModule(appContext: appContext) {
      $0.onAppEntersForeground {
        expect.fulfill()
      }
    }
    appContext.moduleRegistry.register(module: module)
    NotificationCenter.default.post(name: UIApplication.willEnterForegroundNotification, object: nil)
    waitForExpectations(timeout: 0)
  }

  func testOnAppBecomesActive() {
    let expect = expectation(description: "onAppBecomesActive is called when system's didBecomeActiveNotification is sent")
    let module = CustomModule(appContext: appContext) {
      $0.onAppBecomesActive {
        expect.fulfill()
      }
    }
    appContext.moduleRegistry.register(module: module)
    NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
    waitForExpectations(timeout: 0)
  }

  func testOnAppEntersBackground() {
    let expect = expectation(description: "onAppEntersBackground is called when system's didEnterBackgroundNotification is sent")
    let module = CustomModule(appContext: appContext) {
      $0.onAppEntersBackground {
        expect.fulfill()
      }
    }
    appContext.moduleRegistry.register(module: module)
    NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: nil)
    waitForExpectations(timeout: 0)
  }
}
