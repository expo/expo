// Copyright 2023-present 650 Industries. All rights reserved.

internal final class CoreModule: Module {
  func definition() -> ModuleDefinition {
    Class("NativeException", NativeException.self) {
      Property("code", \.exception.code)
      Property("reason", \.exception.reason)
      Property("cause", \.cause)
    }
  }
}

internal final class NativeException: SharedObject {
  let exception: Exception

  init(_ exception: Exception) {
    self.exception = exception
  }

  lazy var cause = exception.cause != nil ? NativeException(exception.cause as! Exception) : nil

  var rootCause: NativeException? {
    return cause?.rootCause
  }
}
