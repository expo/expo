// Copyright 2024-present 650 Industries. All rights reserved.

internal enum EventObservingType: String {
  case startObserving
  case stopObserving
}

internal protocol AnyEventObservingDefinition: AnyDefinition {
  var event: String? { get }

  var type: EventObservingType { get }

  func call()
}

public final class EventObservingDefinition: AnyEventObservingDefinition {
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

public struct EventObservingDecorator: JavaScriptObjectDecorator {
  let definitions: [any AnyEventObservingDefinition]

  /**
   Decorates the given object with `startObserving` and `stopObserving` functions.
   These functions are automatically called by the `EventEmitter` implementation.
   */
  func decorate(object: JavaScriptObject, appContext: AppContext) throws {
    // We need to keep track the number of observed events
    // so we can call observers not attached to any event in the right moment.
    var observingEvents: Int = 0

    let startObserving = AsyncFunctionDefinition(
      EventObservingType.startObserving.rawValue,
      firstArgType: String.self,
      dynamicArgumentTypes: [~String.self]
    ) { (event: String) in
      observingEvents += 1

      for definition in definitions where definition.type == .startObserving {
        if definition.event == event || (observingEvents == 1 && definition.event == nil) {
          definition.call()
        }
      }
    }

    let stopObserving = AsyncFunctionDefinition(
      EventObservingType.stopObserving.rawValue,
      firstArgType: String.self,
      dynamicArgumentTypes: [~String.self]
    ) { (event: String) in
      observingEvents -= 1

      for definition in definitions where definition.type == .stopObserving {
        if definition.event == event || (observingEvents == 0 && definition.event == nil) {
          definition.call()
        }
      }
    }

    object.setProperty(startObserving.name, value: try startObserving.build(appContext: appContext))
    object.setProperty(stopObserving.name, value: try stopObserving.build(appContext: appContext))
  }
}
