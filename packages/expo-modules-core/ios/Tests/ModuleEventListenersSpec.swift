import ExpoModulesTestCore

@testable import ExpoModulesCore

/**
 This test spec covers module's event listeners which can listen to:
 - module's lifecycle events
 - app's lifecycle notifications
 - custom events sent to the module registry

 NOTE: Each test registers the module because only registered modules can capture events.
 */
class ModuleEventListenersSpec: ExpoSpec {
  override func spec() {
    var appContext: AppContext!

    beforeEach {
      appContext = AppContext()
    }

    it("calls OnCreate once the module instance is created") {
      waitUntil { done in
        _ = mockModuleHolder(appContext) {
          OnCreate {
            done()
          }
        }
      }
    }

    it("calls OnDestroy once the module is about to be deallocated") {
      waitUntil { done in
        let moduleName = "mockedModule"
        let holder = mockModuleHolder(appContext) {
          Name(moduleName)
          OnDestroy {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        // Unregister the module to deallocate its holder
        appContext.moduleRegistry.unregister(moduleName: holder.name)
        // The `module` object is actually still alive, but its holder is dead
      }
    }

    it("calls OnAppContextDestroys once the context destroys") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          OnAppContextDestroys {
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

    it("calls OnAppEntersForeground when system's willEnterForegroundNotification is sent") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          OnAppEntersForeground {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        NotificationCenter.default.post(name: UIApplication.willEnterForegroundNotification, object: nil)
      }
    }

    it("calls OnAppBecomesActive when system's didBecomeActiveNotification is sent") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          OnAppBecomesActive {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        NotificationCenter.default.post(name: UIApplication.didBecomeActiveNotification, object: nil)
      }
    }

    it("calls OnAppEntersBackground when system's didEnterBackgroundNotification is sent") {
      waitUntil { done in
        let holder = mockModuleHolder(appContext) {
          OnAppEntersBackground {
            done()
          }
        }
        appContext.moduleRegistry.register(holder: holder)
        NotificationCenter.default.post(name: UIApplication.didEnterBackgroundNotification, object: nil)
      }
    }
  }
}
