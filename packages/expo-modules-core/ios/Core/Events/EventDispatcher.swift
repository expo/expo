// Copyright 2022-present 650 Industries. All rights reserved.

/**
 An object that can dispatch native events.
 */
public final class EventDispatcher {
  /**
   Type of the event dispatcher handler.
   - Note: It must be marked as `@convention(block)` as long as we support Objective-C views and thus need to use `setValue(_:forKey:)`.
   */
  internal typealias Handler = @convention(block) ([String: Any]) -> Void

  /**
   A custom name of the dispatching event. The default name is usually a name of the property holding the dispatcher.
   */
  internal var customName: String?

  /**
   A function that is invoked to dispatch the event, no-op by default.
   Something that manages the events should override it.
   */
  internal var handler: Handler?

  /**
   Default initializer of the event dispatcher. Provide a custom name if you want the dispatcher
   to refer to an event with different name than the property holding the dispatcher.
   */
  public init(_ customName: String? = nil) {
    self.customName = customName
  }

  // MARK: - Calling as function

  /**
   Dispatches the event with the given dictionary as a payload.
   */
  public func callAsFunction(_ payload: [String: Any]) {
    handler?(payload)
  }

  /**
   Dispatches the event with the given record as a payload.
   */
  public func callAsFunction(_ payload: Record) {
    handler?(payload.toDictionary())
  }

  /**
   Dispatches the event with an empty payload.
   */
  public func callAsFunction() {
    handler?([:])
  }
}

/**
 Installs convenient event dispatchers for the given event and view.
 The provided handler can be specific to Paper or Fabric.
 */
internal func installEventDispatcher<ViewType>(forEvent eventName: String, onView view: ViewType, handler: @escaping EventDispatcher.Handler) {
  // Find view's property that is of type `EventDispatcher` and refers to this particular event name.
  let child = Mirror(reflecting: view).children.first {
    return isEventDispatcherWithName($0, eventName)
  }

  if let eventDispatcher = child?.value as? EventDispatcher {
    eventDispatcher.handler = handler
  } else if let view = view as? UIView, view.responds(to: Selector(eventName)) {
    // This is to handle events in legacy views written in Objective-C.
    // Note that the property should be of type EXDirectEventBlock.
    view.setValue(handler, forKey: eventName)
  } else {
    log.warn("Couldn't find the property for event '\(eventName)' in '\(type(of: view))' class")
  }
}

/**
 Checks whether the mirror child refers to the event dispatcher with the given event name.
 */
private func isEventDispatcherWithName(_ mirrorChild: Mirror.Child, _ eventName: String) -> Bool {
  guard let eventDispatcher = mirrorChild.value as? EventDispatcher else {
    return false
  }
  return eventDispatcher.customName != nil ? eventDispatcher.customName == eventName : mirrorChild.label == eventName
}
