// Copyright 2022-present 650 Industries. All rights reserved.

import Dispatch
import ExpoModulesJSI

/**
 Type-erased protocol for asynchronous functions.
 */
internal protocol AnyAsyncFunctionDefinition: AnyFunctionDefinition {
  /**
   Specifies on which queue the function should run.
   */
  @discardableResult
  func runOnQueue(_ queue: DispatchQueue?) -> Self
}

/**
 The default queue used for module's async function calls.
 */
private let defaultQueue = DispatchQueue(label: "expo.modules.AsyncFunctionQueue", qos: .userInitiated)

/**
 Represents a function that can only be called asynchronously, thus its JavaScript equivalent returns a Promise.
 */
public class AsyncFunctionDefinition<Args, FirstArgType, ReturnType>: AnyAsyncFunctionDefinition, @unchecked Sendable {
  typealias ClosureType = (Args) throws -> ReturnType

  /**
   The underlying closure to run when the function is called.
   */
  let body: ClosureType

  /**
   Bool value indicating whether the function takes promise as the last argument.
   */
  let takesPromise: Bool

  /**
   Dispatch queue on which each function's call is run.
   */
  var queue: DispatchQueue?

  init(
    _ name: String,
    firstArgType: FirstArgType.Type,
    dynamicArgumentTypes: [AnyDynamicType],
    _ body: @escaping ClosureType
  ) {
    self.name = name
    self.takesPromise = dynamicArgumentTypes.last?.wraps(Promise.self) ?? false
    self.dynamicArgumentTypes = dynamicArgumentTypes
    self.body = body
  }

  // MARK: - AnyFunction

  let name: String

  let dynamicArgumentTypes: [AnyDynamicType]

  var argumentsCount: Int {
    return dynamicArgumentTypes.count - (takesOwner ? 1 : 0) - (takesPromise ? 1 : 0)
  }

  var takesOwner: Bool = false

  @JavaScriptActor
  func call(_ appContext: AppContext, this: borrowing JavaScriptValue, arguments: consuming JSValuesBuffer, callback: @Sendable @escaping (consuming FunctionCallResult) -> Void) {
    let promise = Promise(appContext: appContext) { value in
      do {
        let jsValue = try appContext.converter.toJS(value, ~ReturnType.self)
        callback(.success(jsValue.ref()))
      } catch let error as Exception {
        callback(.failure(error))
      } catch {
        callback(.failure(UnexpectedException(error)))
      }
    } rejecter: { exception in
      callback(.failure(exception))
    }
    var nativeArguments: [Any]

    do {
      try validateArgumentsNumber(function: self, received: arguments.count)

      // Arguments must be converted on the JS thread, before we jump to another thread.
      nativeArguments = try toNativeClosureArguments(converter: appContext.converter, fn: self, this: this, arguments: arguments)

      if takesPromise {
        nativeArguments.append(promise)
      }
    } catch let error as Exception {
      callback(.failure(error))
      return
    } catch {
      callback(.failure(UnexpectedException(error)))
      return
    }

    let queue = queue ?? defaultQueue

    dispatchOnQueueUntilViewRegisters(appContext: appContext, arguments: nativeArguments, queue: queue) { [body, name] in
      let returnedValue: ReturnType?

      do {
        guard let argumentsTuple = try Conversions.toTuple(nativeArguments) as? Args else {
          throw ArgumentConversionException()
        }
        returnedValue = try body(argumentsTuple)
      } catch let error as Exception {
        promise.reject(FunctionCallException(name).causedBy(error))
        return
      } catch {
        promise.reject(UnexpectedException(error))
        return
      }
      if !self.takesPromise {
        promise.resolve(returnedValue)
      }
    }
  }

  /**
   * Checks if the `AsyncFunction` is a method of a `View`, if it is and the `View` has not yet been registered in the view registry it
   * re-dispatches the block until the view registers. The block can be re-dispatched up to three times before the cast is considered failed.
   * This is a sub-optimal solution, but the only one until we get access to the runtime scheduler. In the vast majority of cases the block
   * will be dispatched without any retries,
   */
  private func dispatchOnQueueUntilViewRegisters(
    appContext: AppContext,
    arguments: [Any],
    queue: DispatchQueue,
    retryCount: Int = 0,
    _ block: @escaping () -> Void
  ) {
    // Empirically a single retry is enough, use three just to be safe
    let maxRetryCount = 3

    queue.async {
#if RCT_NEW_ARCH_ENABLED
      // Checks if this is a view function unregistered in the view registry. The check can be performed from the main thread only.
      if retryCount < maxRetryCount,
        let viewTag = arguments.first as? Int,
        let uiManager = appContext.reactBridge?.uiManager,
        self.dynamicArgumentTypes.first is DynamicViewType,
        Thread.isMainThread, // swiftlint:disable:next legacy_objc_type
        uiManager.view(forReactTag: NSNumber(value: viewTag)) == nil {
        // Schedule the block on the original queue through UI manager if view is missing in the registry.
        self.dispatchOnQueueUntilViewRegisters(appContext: appContext, arguments: arguments, queue: queue, retryCount: retryCount + 1, block)
        return
      }
#endif
      // Schedule the block as normal.
      block()
    }
  }

  // MARK: - JavaScriptObjectBuilder

  @JavaScriptActor
  func build(appContext: AppContext) throws -> JavaScriptObject {
    // It seems to be safe to capture a strong reference to `self` here. This is needed for detached functions, that are not part of the module definition.
    // Module definitions are held in memory anyway, but detached definitions (returned by other functions) are not, so we need to capture them here.
    // It will be deallocated when that JS host function is garbage-collected by the JS VM.
    let function = try appContext.runtime.createSyncFunction(name) { [weak appContext, self] this, arguments in
      guard let appContext else {
        throw Exceptions.AppContextLost()
      }
      let promise = JavaScriptPromise(try appContext.runtime)
      let promiseValue = promise.asValue()

      self.call(appContext, this: this, arguments: arguments) { [promise] result in
        switch result {
        case .success(let value):
          promise.resolve(value.take() ?? .undefined())
        case .failure(_):
          promise.reject(Exception())
        }
      }
      return promiseValue
    }
    return function.asObject()
  }

  // MARK: - AnyAsyncFunctionDefinition

  public func runOnQueue(_ queue: DispatchQueue?) -> Self {
    self.queue = queue
    return self
  }
}

extension AsyncFunctionDefinition {
  var requiredArgumentsCount: Int {
    var trailingOptionalArgumentsCount: Int = 0

    let reversedArgumentTypes = dynamicArgumentTypes.reversed()

    let reversedArgumentsToIterate: any Sequence<AnyDynamicType> = takesPromise
      ? reversedArgumentTypes.dropFirst()
      : reversedArgumentTypes

    for dynamicArgumentType in reversedArgumentsToIterate {
      if dynamicArgumentType is DynamicOptionalType {
        trailingOptionalArgumentsCount += 1
      } else {
        break
      }
    }

    return argumentsCount - trailingOptionalArgumentsCount
  }
}
