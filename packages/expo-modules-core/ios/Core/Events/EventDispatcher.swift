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

  public var onEventSent: (([String: Any]) -> Void)?

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
    onEventSent?(payload)
  }

  /**
   Dispatches the event with the given record as a payload.
   */
  public func callAsFunction(_ payload: Record) {
    handler?(payload.toDictionary())
    onEventSent?(payload.toDictionary())
  }

  /**
   Dispatches the event with an empty payload.
   */
  public func callAsFunction() {
    handler?([:])
    onEventSent?([:])
  }
}

/**
 Installs convenient event dispatchers for the given event and view.
 The provided handler can be specific to Paper or Fabric.
 */
internal func installEventDispatcher<ViewType>(forEvent eventName: String, onView view: ViewType, handler: @escaping EventDispatcher.Handler) {
  if let eventDispatcher = findEventDispatcher(forEvent: eventName, onView: view) {
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
 Positions of `EventDispatcher` properties among the `Mirror` children of a view, by the view type and the event name.
 */
internal let eventDispatcherIndices = Mutex<[ObjectIdentifier: [String: Int]]>([:])

/**
 Finds the view's property that is of type `EventDispatcher` and refers to the given event name.
 */
private func findEventDispatcher<ViewType>(forEvent eventName: String, onView view: ViewType) -> EventDispatcher? {
  let children = Mirror(reflecting: view).children
  let viewTypeId = ObjectIdentifier(type(of: view))

  // The search below reads each child before the match. All views of a type have the same stored properties,
  // so first read only the child at the position that the search found for an earlier view.
  // That child must pass the same check, so a wrong position only costs a search.
  if let index = eventDispatcherIndices.withLock({ $0[viewTypeId]?[eventName] }), index < children.count {
    let child = children[children.index(children.startIndex, offsetBy: index)]
    if isEventDispatcherWithName(child, eventName) {
      return child.value as? EventDispatcher
    }
  }
  for (index, child) in children.enumerated() where isEventDispatcherWithName(child, eventName) {
    eventDispatcherIndices.withLock { $0[viewTypeId, default: [:]][eventName] = index }
    return child.value as? EventDispatcher
  }
  return nil
}

/**
 Checks whether the mirror child refers to the event dispatcher with the given event name.
 */
internal func isEventDispatcherWithName(_ mirrorChild: Mirror.Child, _ eventName: String) -> Bool {
  guard let eventDispatcher = mirrorChild.value as? EventDispatcher else {
    return false
  }
  return eventDispatcher.customName != nil ? eventDispatcher.customName == eventName : mirrorChild.label == eventName
}
