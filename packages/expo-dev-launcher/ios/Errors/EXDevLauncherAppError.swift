// Copyright 2015-present 650 Industries. All rights reserved.

@objc
public class EXDevLauncherAppError: NSObject {
  let message: String
  let stack: [RCTJSStackFrame]?

  @objc
  public init(message: String, stack: [RCTJSStackFrame]? = nil) {
    self.message = message
    self.stack = stack
  }
}
