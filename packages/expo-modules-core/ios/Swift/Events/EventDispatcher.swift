// Copyright 2022-present 650 Industries. All rights reserved.

/**
 Type of the dispatcher handler.
 - Note: It must be marked as `@convention(block)` as long as we support Objective-C views and thus need to use `setValue(_: forKey)`.
 */
internal typealias EventDispatcherHandler = @convention(block) ([String: Any]) -> Void

/**
 Installs convenient event dispatchers for the given event and view.
 The provided handler can be specific to Paper or Fabric.
 */
internal func installEventDispatcher<ViewType>(forEvent eventName: String, onView view: ViewType, handler: @escaping EventDispatcherHandler) {
  // Find view's property that is named as the prop and is wrapped by `Event`.
  let child = Mirror(reflecting: view).children.first {
    $0.label == "_\(eventName)"
  }

  if let event = child?.value as? AnyEventInternal {
    event.settle(handler)
  } else if let view = view as? UIView, view.responds(to: Selector(eventName)) {
    // This is to handle events in legacy views written in Objective-C.
    // Note that the property should be of type EXDirectEventBlock.
    view.setValue(handler, forKey: eventName)
  } else {
    log.warn("Couldn't find the property for event '\(eventName)' in '\(type(of: view))' class")
  }
}
