/**
 An alias to `Result<Any, Exception>` which can be passed to the function callback.
 */
public typealias FunctionCallResult = Result<Any, Exception>

/**
 A protocol for any type-erased function.
 */
internal protocol AnyFunctionDefinition: AnyDefinition, JavaScriptObjectBuilder {
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
   A minimum number of arguments the functions needs which equals to `argumentsCount` reduced by the number of trailing optional arguments.
   */
  var requiredArgumentsCount: Int { get }

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
      - appContext: An app context where the function is being executed.
      - callback: A callback that receives a result of the function execution.
   */
  func call(by owner: AnyObject?, withArguments args: [Any], appContext: AppContext, callback: @escaping (FunctionCallResult) -> ())
}

extension AnyFunctionDefinition {
  var requiredArgumentsCount: Int {
    var trailingOptionalArgumentsCount: Int = 0

    for dynamicArgumentType in dynamicArgumentTypes.reversed() {
      if dynamicArgumentType is DynamicOptionalType {
        trailingOptionalArgumentsCount += 1
      } else {
        break
      }
    }
    return argumentsCount - trailingOptionalArgumentsCount
  }

  var argumentsCount: Int {
    return dynamicArgumentTypes.count
  }

  /**
   Calls the function just like `call(by:withArguments:appContext:callback:)`, but without an owner
   and with an empty callback. Might be useful when you only want to call the function,
   but don't care about the result.
   */
  func call(withArguments args: [Any], appContext: AppContext) {
    call(by: nil, withArguments: args, appContext: appContext, callback: { _ in })
  }
}

internal class FunctionCallException: GenericException<String> {
  override var reason: String {
    "Calling the '\(param)' function has failed"
  }

  override var code: String {
    guard let cause = cause as? Exception else {
      return super.code
    }
    return cause.code
  }
}
