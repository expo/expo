/**
 An alias to `Result<Any, Exception>` which can be passed to the function callback.
 */
public typealias FunctionCallResult = Result<Any, Exception>

/**
 A protocol for any type-erased function.
 */
internal protocol AnyFunction: AnyDefinition, JavaScriptObjectBuilder {
  /**
   Name of the function. JavaScript refers to the function by this name.
   */
  var name: String { get }

  /**
   An array of the dynamic types that the function takes. If the last type is `Promise`, it's not included.
   */
  var dynamicArgumentTypes: [AnyDynamicType] { get }

  /**
   A number of arguments the function takes. If the function expects to receive an owner (`this`) as the first argument, it's not counted.
   Similarly, if the last argument is of type `Promise`, it is not counted.
   */
  var argumentsCount: Int { get }

  /**
   Indicates whether the function's arguments starts from the owner that calls this function.
   */
  var takesOwner: Bool { get set }

  /**
   Calls the function with a given owner and arguments and returns a result through the callback block.
   - Parameters:
      - owner: An object that calls this function. If the `takesOwner` property is true
      and type of the first argument matches the owner type, it's being passed as the argument.
      - args: An array of arguments to pass to the function. They could be Swift primitives
      when invoked through the bridge and in unit tests or `JavaScriptValue`s
      when the function is called through the JSI.
      - callback: A callback that receives a result of the function execution.
   */
  func call(by owner: AnyObject?, withArguments args: [Any], callback: @escaping (FunctionCallResult) -> ())
}

extension AnyFunction {
  /**
   Calls the function just like `call(by:withArguments:callback:)`, but without an owner
   and with an empty callback. Might be useful when you only want to call the function,
   but don't care about the result.
   */
  func call(withArguments args: [Any]) {
    call(by: nil, withArguments: args, callback: { _ in })
  }
}

internal class FunctionCallException: GenericException<String> {
  override var reason: String {
    "Calling the '\(param)' function has failed"
  }
}
