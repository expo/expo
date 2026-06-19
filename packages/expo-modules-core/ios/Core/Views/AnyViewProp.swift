import ExpoModulesJSI

/**
 Type-erased protocol for view props classes.
 */
public protocol AnyViewProp: AnyViewDefinitionElement {
  /**
   Name of the view prop that JavaScript refers to.
   */
  var name: String { get }

  /**
   Function that sets the underlying prop value for given view.
   */
  func set(value: Any, onView: UIView, appContext: AppContext) throws

  /**
   Decodes the given JavaScript value into the prop's native representation, without
   touching the view. Must be run on the JavaScript thread. The returned value is detached
   from the runtime and safe to hand to `applyDecoded(value:onView:)` on the main thread.
   */
  @JavaScriptActor
  func decode(jsValue: JavaScriptValue, appContext: AppContext) throws -> Any

  /**
   Applies an already-decoded value (produced by `decode(jsValue:appContext:)`) to the view.
   Must be run on the main thread.
   */
  @MainActor
  func applyDecoded(value: Any, onView: UIView, appContext: AppContext) throws
}
