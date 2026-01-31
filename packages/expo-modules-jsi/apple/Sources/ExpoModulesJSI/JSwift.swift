// Copyright 2025-present 650 Industries. All rights reserved.

public struct JS {
  public typealias Runtime = JavaScriptRuntime
  public typealias Value = JavaScriptValue
  public typealias Object = JavaScriptObject
  public typealias Function = JavaScriptFunction

  public static func runtimeLostFatalError() -> Never {
    fatalError("The JavaScript runtime has been deallocated")
  }
}
