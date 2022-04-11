// Copyright 2022-present 650 Industries. All rights reserved.

// FIXME: Calling module's functions needs solid refactoring to not reference the module holder.
// Instead, it should be possible to directly call the function instance from here. (added by @tsapeta)

/**
 Creates a block that is executed when the module's async function is called.
 */
internal func createAsyncFunctionBlock(holder: ModuleHolder, name functionName: String) -> JSAsyncFunctionBlock {
  let moduleName = holder.name
  return { [weak holder, moduleName] args, resolve, reject in
    guard let holder = holder else {
      let exception = ModuleUnavailableException(moduleName)
      reject(exception.code, exception.description, exception)
      return
    }
    holder.call(function: functionName, args: args) { result, error in
      if let error = error {
        reject(error.code, error.description, error)
      } else {
        resolve(result)
      }
    }
  }
}

/**
 Creates a block that is executed when the module's sync function is called.
 */
internal func createSyncFunctionBlock(holder: ModuleHolder, name functionName: String) -> JSSyncFunctionBlock {
  return { [weak holder] args in
    guard let holder = holder else {
      return nil
    }
    return holder.callSync(function: functionName, args: args)
  }
}

/**
 If given argument is a JavaScriptValue, it's unpacked and converted to corresponding Foundation type.
 Otherwise, the argument is returned as is.
 */
internal func unpackIfJavaScriptValue(_ value: Any) -> Any {
  if let value = value as? JavaScriptValue {
    return value.getRaw() as Any
  }
  return value
}

private class ModuleUnavailableException: GenericException<String> {
  override var reason: String {
    "Module '\(param)' is no longer available"
  }
}
