import Quick
import Nimble

@testable import ExpoModulesCore

/**
 This test spec covers module's event listeners which can listen to:
 - module's lifecycle events
 - app's lifecycle notifications
 - custom events sent to the module registry

 NOTE: Each test registers the module because only registered modules can capture events.
 */
class ModuleEventListenersSpec: QuickSpec {
  override func spec() {
    var appContext: AppContext!

    beforeEach {
      appContext = AppContext()
    }

    it("calls onCreate once the module is registered") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.onCreate {
            done()
          }
        }
        appContext.moduleRegistry.register(module: module)
      }
    }

    it("calls onDestroy once the module is about to be deallocated") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.onDestroy {
            done()
          }
        }
        appContext.moduleRegistry.register(module: module)
        // Unregister the module to deallocate its holder
        appContext.moduleRegistry.unregister(module: module)
        // The `module` object is actually still alive, but its holder is dead
      }
    }

    it("calls onAppContextDestroys once the context destroys") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.onAppContextDestroys {
            done()
          }
        }
        appContext.moduleRegistry.register(module: module)
        appContext = nil // This must deallocate the app context
      }
    }

    it("calls custom event listener when the event is sent to the registry") {
      waitUntil { done in
        let event = EventName.custom("custom event name")
        let module = CustomModule(appContext: appContext) { _ in
          EventListener(event) {
            done()
          }
        }
        appContext.moduleRegistry.register(module: module)
        appContext.moduleRegistry.post(event: event)
      }
    }

    it("calls onAppEntersForeground when system's willEnterForegroundNotification is sent") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.onAppEntersForeground {
            done()
          }
        }
        appContext.moduleRegistry.register(module: module)
        NotificationCenter.default.post(name: UIApplication.willEnterForegroundNotification, object: nil)
      }
    }

    it("calls onAppBecomesActive when system's didBecomeActiveNotification is sent") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.onAppBecomesActive {
            done()
          }
        }
        appContext.moduleRegistry.register(module: module)
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
      }
    }

    it("calls onAppEntersBackground when system's didEnterBackgroundNotification is sent") {
      waitUntil { done in
        let module = CustomModule(appContext: appContext) {
          $0.onAppEntersBackground {
            done()
          }
        }
        appContext.moduleRegistry.register(module: module)
        NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: nil)
      }
    }
  }
}
