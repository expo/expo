// Copyright 2022-present 650 Industries. All rights reserved.

/**
 An enum that identifies lifecycle method types.
 */
public enum ViewLifecycleMethodType {
  case didUpdateProps
}

/**
 Type-erased protocol for all view lifecycle methods.
 */
internal protocol AnyViewLifecycleMethod: AnyDefinition {
  /**
   Type of the lifecycle method.
   */
  var type: ViewLifecycleMethodType { get }

  /**
   Calls the lifecycle method for the given view.
   */
  func callAsFunction(_ view: UIView)
}

/**
 Element of the view definition that represents a lifecycle method, such as `OnViewDidUpdateProps`.
 */
public final class ViewLifecycleMethod<ViewType: UIView>: AnyViewLifecycleMethod {
  /**
   The actual closure that gets called when the view signals an event in view's lifecycle.
   */
  let closure: (ViewType) -> Void

  let type: ViewLifecycleMethodType

  init(type: ViewLifecycleMethodType, closure: @escaping (ViewType) -> Void) {
    self.type = type
    self.closure = closure
  }

  func callAsFunction(_ view: UIView) {
    guard let view = view as? ViewType else {
      log.warn("Cannot call lifecycle method '\(type)', given view is not of type '\(ViewType.self)'")
      return
    }
    closure(view)
  }
}
