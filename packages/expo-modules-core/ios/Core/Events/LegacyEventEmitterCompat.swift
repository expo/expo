// Copyright 2024-present 650 Industries. All rights reserved.

public final class LegacyEventEmitterCompat: EXEventEmitterService {
  internal weak var appContext: AppContext?

  init(appContext: AppContext) {
    self.appContext = appContext
  }

  // Objective-C protocol doesn't specify nullability
  // swiftlint:disable:next implicitly_unwrapped_optional
  public func sendEvent(withName name: String!, body: Any!) {
    guard let appContext, let runtime = try? appContext.runtime else {
      log.warn("Unable to send an event '\(String(describing: name))' because the runtime is not available")
      return
    }

    // Send the event to all modules that declare support for this particular event.
    // That's how it works in the device event emitter provided by React Native.
    let moduleHoldersWithEvent = appContext.moduleRegistry.filter { holder in
      return holder.definition.eventNames.contains(name)
    }

    runtime.schedule {
      for holder in moduleHoldersWithEvent {
        if let jsObject = holder.javaScriptObject {
          JSIUtils.emitEvent(name, to: jsObject, withArguments: [body], in: runtime)
        }
      }
    }
  }
}
