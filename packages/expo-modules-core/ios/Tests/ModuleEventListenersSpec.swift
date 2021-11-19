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

    it("calls onCreate once the module instance is created") {
      waitUntil { done in
        let _ = mockModuleHolder(appContext) {
          $0.onCreate {
            done()
          }
        }
      }
    }

    it("calls onDestroy once the module is about to be deallocated") {
      waitUntil { done in
        let moduleName = "mockedModule"
        let holder = mockModuleHolder(appContext) {
          $0.name(moduleName)
          $0.onDestroy {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        // Unregister the module to deallocate its holder
        appContext.moduleRegistry.unregister(moduleName: holder.name)
        // The `module` object is actually still alive, but its holder is dead
      }
    }

    it("calls onAppContextDestroys once the context destroys") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          $0.onAppContextDestroys {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        appContext = nil // This must deallocate the app context
      }
    }

    it("calls custom event listener when the event is sent to the registry") {
      waitUntil { done in
        let event = EventName.custom("custom event name")
        let holder = mockModuleHolder(appContext) {
          EventListener(event) {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        appContext.moduleRegistry.post(event: event)
      }
    }

    it("calls onAppEntersForeground when system's willEnterForegroundNotification is sent") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          $0.onAppEntersForeground {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        NotificationCenter.default.post(name: UIApplication.willEnterForegroundNotification, object: nil)
      }
    }

    it("calls onAppBecomesActive when system's didBecomeActiveNotification is sent") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          $0.onAppBecomesActive {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
      }
    }

    it("calls onAppEntersBackground when system's didEnterBackgroundNotification is sent") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          $0.onAppEntersBackground {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: nil)
      }
    }
  }
}
