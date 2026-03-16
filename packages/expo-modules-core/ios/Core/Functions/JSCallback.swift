// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 A multi-fire async callback that invokes a JavaScript function from native.
 */
public final class JSCallback: @unchecked Sendable {
  /// The underlying JS function to invoke.
  private let rawFunction: RawJavaScriptFunction

  private weak var appContext: AppContext?

  /// Whether this callback is still valid.
  private var isValid: Bool = true

  private let lock = NSLock()

  init(rawFunction: RawJavaScriptFunction, appContext: AppContext) {
    self.rawFunction = rawFunction
    self.appContext = appContext
  }

  public func callAsFunction<each A: AnyArgument>(_ arguments: repeat each A) {
    var argumentPairs: [(AnyArgument, AnyDynamicType)] = []
    repeat argumentPairs.append((each arguments, ~(each A).self))
    invoke(argumentPairs: argumentPairs)
  }

  public func invalidate() {
    lock.lock()
    defer { lock.unlock() }
    isValid = false
  }

  private func invoke(argumentPairs: [(AnyArgument, AnyDynamicType)]) {
    lock.lock()
    guard isValid else {
      lock.unlock()
      return
    }
    lock.unlock()

    guard let appContext, let runtime = try? appContext.runtime else {
      return
    }

    let rawFunction = self.rawFunction
    nonisolated(unsafe) let pairs = argumentPairs
  
    runtime.schedule { [weak appContext] in
      guard let appContext, let _ = try? appContext.runtime else { return }

      let args = pairs.map { argument, dynamicType in
        return Conversions.convertFunctionResult(argument, appContext: appContext, dynamicType: dynamicType)
      }

      _ = rawFunction.call(withArguments: args, thisObject: nil, asConstructor: false)
    }
  }
}

extension JSCallback: AnyArgument {
  public static func getDynamicType() -> AnyDynamicType {
    return DynamicJSCallbackType()
  }
}
