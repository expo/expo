/**
 A protocol for any type-erased view definition.
 */
public protocol AnyViewDefinition {
  /**
   An array of view props supported by the view.
   */
  var props: [AnyViewProp] { get }

  var name: String { get }

  /**
   Names of the events that the view can send to JavaScript.
   */
  var eventNames: [String] { get }

  /**
   Creates an instance of the native view.
   */
  func createView(appContext: AppContext) -> AppleView?

  /**
   Returns props definitions as a dictionary where the keys are the prop names.
   */
  func propsDict() -> [String: AnyViewProp]

  /**
   Returns a list of prop names supported by the view.
   */
  func getSupportedPropNames() -> [String]

  /**
   Returns a list of event names supported by the view.
   */
  func getSupportedEventNames() -> [String]

  /**
   Calls defined lifecycle methods with the given type.
   */
  func callLifecycleMethods(withType type: ViewLifecycleMethodType, forView view: AppleView)

  /**
   Creates a JavaScript object that may be used as a React component prototype.
   */
  func createReactComponentPrototype(appContext: AppContext) throws -> JavaScriptObject
}
