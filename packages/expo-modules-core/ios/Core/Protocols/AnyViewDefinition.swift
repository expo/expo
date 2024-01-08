/**
 A protocol for any type-erased view definition.
 */
public protocol AnyViewDefinition {
  /**
   An array of view props supported by the view.
   */
  var props: [AnyViewProp] { get }

  /**
   Names of the events that the view can send to JavaScript.
   */
  var eventNames: [String] { get }

  /**
   Creates an instance of the native view.
   */
  func createView(appContext: AppContext) -> UIView?

  /**
   Returns props definitions as a dictionary where the keys are the prop names.
   */
  func propsDict() -> [String: AnyViewProp]

  /**
   Calls defined lifecycle methods with the given type.
   */
  func callLifecycleMethods(withType type: ViewLifecycleMethodType, forView view: UIView)

  /**
   Creates a JavaScript object that may be used as a React component prototype.
   */
  func createReactComponentPrototype(appContext: AppContext) throws -> JavaScriptObject
}
