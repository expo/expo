// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesJSI

internal enum EventObservingType: String {
  case startObserving
  case stopObserving
}

internal protocol AnyEventObservingDefinition: AnyDefinition, Sendable {
  var event: String? { get }

  var type: EventObservingType { get }

  func call()
}

public final class EventObservingDefinition: AnyEventObservingDefinition, @unchecked Sendable {
  public var _definitionClassification: DefinitionClassification {
    return DefinitionClassification(kind: .eventObserver(self))
  }

  public typealias ClosureType = () -> Void

  let type: EventObservingType

  let event: String?

  let closure: ClosureType

  init(type: EventObservingType, event: String?, _ closure: @escaping ClosureType) {
    self.type = type
    self.event = event
    self.closure = closure
  }

  func call() {
    closure()
  }
}

/// Calls the `OnStartObserving` and `OnStopObserving` definitions of a module when its JavaScript object
/// gets the first listener for an event, or loses the last listener for an event.
internal final class EventObservers {
  let definitions: [any AnyEventObservingDefinition]

  // The number of events that have listeners. The event emitter changes it on the JS thread only.
  private var observingEvents: Int = 0

  init(definitions: [any AnyEventObservingDefinition]) {
    self.definitions = definitions
  }

  func didStartListening(event: String, appContext: AppContext) {
    observingEvents += 1
    // Observers not attached to any event are called when the first event gets a listener.
    call(.startObserving, event: event, includingObserversOfAllEvents: observingEvents == 1, appContext: appContext)
  }

  func didStopListening(event: String, appContext: AppContext) {
    observingEvents -= 1
    // Observers not attached to any event are called when no event has listeners.
    call(.stopObserving, event: event, includingObserversOfAllEvents: observingEvents == 0, appContext: appContext)
  }

  private func call(
    _ type: EventObservingType,
    event: String,
    includingObserversOfAllEvents: Bool,
    appContext: AppContext
  ) {
    let definitions = definitions.filter { definition in
      return definition.type == type
        && (definition.event == event || (includingObserversOfAllEvents && definition.event == nil))
    }
    if definitions.isEmpty {
      return
    }
    let callDefinitions = {
      for definition in definitions {
        definition.call()
      }
    }
    // The observers run on the queue of async functions. Without a host scheduler (e.g. in tests), they run inline.
    if (try? appContext.runtime.supportsAsyncScheduling) == true {
      asyncFunctionQueue.async(execute: callDefinitions)
    } else {
      callDefinitions()
    }
  }
}
