// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
internal import React

// WebSocket stays with React Native. `new WebSocket()` is `RCTWebSocketModule`, which already
// calls `RCTInspectorWebSocketReporter`. Those calls no-op unless `fuseboxWebSocketEventsEnabled`
// is on (default false, canary). Do not report them here. The request id is created inside
// `WebSocket.js`, so the initiator is that file until React Native records the caller's stack.

/**
 Reports the lifecycle of one network request to React Native's core network reporter
 (`RCTInspectorNetworkReporter`), which backs the React Native DevTools Network panel and the
 Web Performance APIs. For networking stacks that bypass React Native's `RCTNetworking`.

 Calls out of order, or after the request has finished, are ignored.
 */
public final class ExpoNetworkReporter: @unchecked Sendable {
  /**
   The id the request is reported under. When created from JS with
   `__NETWORK_REPORTER__.createDevToolsRequestId()`, DevTools shows the JS call stack as its initiator.
   */
  public let requestId: String

  private enum State {
    case created
    case started
    case finished
  }

  private let lock = NSLock()
  private var state = State.created
  private var isTextResponse = false
#if DEBUG
  private var responseBody = Data()
  private var responseBodyExceedsLimit = false
#endif

  static let maxResponseBodySize = 1_048_576

  public init(devToolsRequestId: String? = nil) {
    self.requestId = devToolsRequestId ?? UUID().uuidString
  }

  /**
   Marks a request as reported here, so Expo's network inspector doesn't report it a second time.
   */
  public func mark(_ request: NSMutableURLRequest) {
    URLProtocol.setProperty(requestId, forKey: Self.requestIdPropertyKey, in: request)
  }

  static func isMarked(_ request: URLRequest) -> Bool {
    return URLProtocol.property(forKey: requestIdPropertyKey, in: request) != nil
  }

  public func requestWillBeSent(_ request: URLRequest) {
    guard transition(from: .created, to: .started) else {
      return
    }
    RCTInspectorNetworkReporter.reportRequestStart(requestId, request: request, encodedDataLength: 0)
    RCTInspectorNetworkReporter.reportConnectionTiming(requestId, request: request)
  }

  public func responseReceived(_ response: URLResponse) {
    guard isState(.started) else {
      return
    }
    let statusCode: Int
    let headers: [String: String]
    if let httpResponse = response as? HTTPURLResponse {
      statusCode = httpResponse.statusCode
      headers = httpResponse.allHeaderFields.reduce(into: [:]) { result, header in
        if let key = header.key as? String, let value = header.value as? String {
          result[key] = value
        }
      }
    } else {
      statusCode = 200
      headers = response.mimeType.map { ["Content-Type": $0] } ?? [:]
    }
    lock.withLock {
      isTextResponse = CdpNetwork.isTextContentType(headers.first { $0.key.lowercased() == "content-type" }?.value)
    }
    RCTInspectorNetworkReporter.reportResponseStart(
      requestId,
      response: response,
      statusCode: Int32(statusCode),
      headers: headers
    )
  }

  public func dataReceived(_ data: Data) {
    guard isState(.started) else {
      return
    }
    RCTInspectorNetworkReporter.reportDataReceived(requestId, data: data)
#if DEBUG
    // Buffered for the Network panel's response preview only.
    lock.withLock {
      if responseBody.count + data.count <= Self.maxResponseBodySize {
        responseBody.append(data)
      } else {
        responseBodyExceedsLimit = true
        responseBody = Data()
      }
    }
#endif
  }

  public func loadingFinished(encodedDataLength: Int) {
    guard transition(from: .started, to: .finished) else {
      return
    }
#if DEBUG
    let (body, isText) = lock.withLock { () -> (Data?, Bool) in
      defer { responseBody = Data() }
      return (responseBodyExceedsLimit || responseBody.isEmpty ? nil : responseBody, isTextResponse)
    }
    if let body {
      if isText, let text = String(data: body, encoding: .utf8) {
        // Flushed to the reporter by `reportResponseEnd`. `maybeStoreResponseBody` only accepts
        // strings from Objective-C, as its header types the body as `NSData`.
        RCTInspectorNetworkReporter.maybeStoreResponseBodyIncremental(requestId, data: text)
      } else {
        RCTInspectorNetworkReporter.maybeStoreResponseBody(requestId, data: body, base64Encoded: true)
      }
    }
#endif
    RCTInspectorNetworkReporter.reportResponseEnd(requestId, encodedDataLength: Int32(clamping: encodedDataLength))
  }

  public func loadingFailed(cancelled: Bool) {
    guard transition(from: .started, to: .finished) else {
      return
    }
    RCTInspectorNetworkReporter.reportRequestFailed(requestId, cancelled: cancelled)
  }

  private func isState(_ expected: State) -> Bool {
    return lock.withLock { state == expected }
  }

  private func transition(from: State, to: State) -> Bool {
    return lock.withLock {
      guard state == from else {
        return false
      }
      state = to
      return true
    }
  }

  private static let requestIdPropertyKey = "ExpoNetworkReporter.requestId"
}

/**
 Records a React Native DevTools network initiator from a synchronous host function.

 Hermes drops host frames when it serializes a stack, so the initiator is the JavaScript
 caller of that host function. A JavaScript wrapper around `createDevToolsRequestId()` would
 be the initiator instead.
 */
public enum ExpoDevToolsInitiator {
  /// The id from `__NETWORK_REPORTER__.createDevToolsRequestId()`, or nil when DevTools is not attached.
  @JavaScriptActor
  public static func requestId(in runtime: JavaScriptRuntime) throws -> String? {
    let reporter = runtime.global().getProperty("__NETWORK_REPORTER__")
    guard reporter.isObject() else {
      return nil
    }
    let create = try reporter.asObject().getPropertyAsFunction("createDevToolsRequestId")
    let id = try create.call()
    guard !id.isUndefined(), !id.isNull() else {
      return nil
    }
    return try id.asString()
  }

  /// A host function that records the initiator, then calls `implementation` with the request id appended.
  /// An id already set on the first argument (`devToolsRequestId`) is reused, so an earlier host call can
  /// own the stack.
  @JavaScriptActor
  public static func hostFunction(
    named name: String,
    calling implementation: borrowing JavaScriptValue,
    in runtime: JavaScriptRuntime
  ) throws -> JavaScriptFunction {
    guard implementation.isFunction() else {
      throw DevToolsInitiatorImplementationException()
    }
    // The closure escapes, so it holds the implementation through a reference.
    let implementation = implementation.copy().ref()
    return runtime.createFunction(name) { _, arguments in
      let requestId = try Self.existingRequestId(arguments) ?? Self.requestId(in: runtime)
      return try Self.call(
        implementation,
        arguments: arguments,
        devToolsRequestId: requestId,
        in: runtime
      )
    }
  }

  @JavaScriptActor
  private static func existingRequestId(_ arguments: borrowing JavaScriptValuesBuffer) -> String? {
    guard arguments.count > 0 else {
      return nil
    }
    let source = arguments[0]
    guard source.isObject() else {
      return nil
    }
    guard let id = try? source.asObject().getProperty("devToolsRequestId").asString(), !id.isEmpty else {
      return nil
    }
    return id
  }

  @JavaScriptActor
  private static func call(
    _ implementation: JavaScriptValue.Ref,
    arguments: borrowing JavaScriptValuesBuffer,
    devToolsRequestId: String?,
    in runtime: JavaScriptRuntime
  ) throws -> JavaScriptValue {
    // The id's slot stays `undefined` when DevTools is not attached.
    let forwarded = JavaScriptValuesBuffer.allocate(in: runtime, capacity: arguments.count + 1)
    for index in 0..<arguments.count {
      forwarded.emplace(arguments[index], at: index)
    }
    if let devToolsRequestId {
      forwarded.emplace(JavaScriptValue(runtime, devToolsRequestId), at: arguments.count)
    }
    guard let function = try implementation.withUnwrappedValue({ (value: borrowing JavaScriptValue) in
      try value.asFunction()
    }) else {
      throw DevToolsInitiatorImplementationException()
    }
    return try function.call(arguments: forwarded)
  }
}

internal final class DevToolsInitiatorImplementationException: Exception, @unchecked Sendable {
  override var reason: String {
    "The implementation behind a DevTools initiator host function must be a JavaScript function"
  }
}
