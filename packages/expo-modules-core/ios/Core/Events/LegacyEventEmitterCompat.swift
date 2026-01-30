// Copyright 2024-present 650 Industries. All rights reserved.

@available(*, deprecated, message: "Use `sendEvent` directly on the module instance instead")
public final class LegacyEventEmitterCompat {
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

    // `Any` is not sendable, so we must trick the compiler.
    let eventArguments = NonisolatedUnsafeVar<[Any]>([body as Any])

    // Send the event to all modules that declare support for this particular event.
    // That's how it works in the device event emitter provided by React Native.
    let moduleHoldersWithEvent = appContext.moduleRegistry.filter { holder in
      return holder.definition.eventNames.contains(name)
    }

//    runtime.schedule {
//      for holder in moduleHoldersWithEvent {
//        if let jsObject = holder.javaScriptObject {
//          JSUtils.emitEvent(name, to: jsObject, withArguments: eventArguments.value, in: runtime)
//        }
//      }
//    }
  }
}
