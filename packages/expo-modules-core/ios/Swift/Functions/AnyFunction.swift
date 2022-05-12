/**
 An alias to `Result<Any, Exception>` which can be passed to the function callback.
 */
public typealias FunctionCallResult = Result<Any, Exception>

/**
 A protocol for any type-erased function.
 */
public protocol AnyFunction: AnyDefinition, JavaScriptObjectBuilder, ClassComponentElement {
  /**
   Name of the function. JavaScript refers to the function by this name.
   */
  var name: String { get }

  /**
   An array of argument types that the function takes. If the last type is `Promise`, it's not included.
   */
  var argumentTypes: [AnyArgumentType] { get }

  /**
   A number of arguments the function takes. If the last argument is of type `Promise`, it is not counted.
   */
  var argumentsCount: Int { get }

  /**
   Calls the function with given arguments and returns a result through the callback block.
   - Parameters:
     - args: An array of arguments to pass to the function. They could be Swift primitives
      when invoked through the bridge and in unit tests or `JavaScriptValue`s
      when the function is called through the JSI
     - callback: A callback that receives a result of the function execution.
   */
  func call(args: [Any], callback: @escaping (FunctionCallResult) -> ())
}

extension AnyFunction {
  /**
   Calls the function just like `call(args:callback:)` but with an empty callback.
   Might be useful when you only want to call the function but don't care about the result.
   */
  func call(args: [Any]) {
    call(args: args, callback: { _ in })
  }
}

internal class FunctionCallException: GenericException<String> {
  override var reason: String {
    "Calling the '\(param)' function has failed"
  }
}
