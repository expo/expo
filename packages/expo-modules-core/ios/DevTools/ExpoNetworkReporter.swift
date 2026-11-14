// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesJSI
import Foundation
internal import React

/**
 Reports the lifecycle of one network request to React Native's core network reporter
 (`RCTInspectorNetworkReporter`), which backs the React Native DevTools Network panel and the
 Web Performance APIs. For networking stacks that bypass React Native's `RCTNetworking`.

 Calls out of order, or after the request has finished, are ignored. Each call runs under the
 reporter's lock, so one that lost the state check cannot reach the core reporter after the
 request has finished.
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

  private struct Storage {
    var state = State.created
    var isTextResponse = false
#if DEBUG
    var responseBody = Data()
    var responseBodyExceedsLimit = false
#endif
  }

  private let storage = Mutex(Storage())

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

  public func willSendRequest(_ request: URLRequest) {
    storage.withLock { storage in
      guard storage.state == .created else {
        return
      }
      storage.state = .started
      RCTInspectorNetworkReporter.reportRequestStart(requestId, request: request, encodedDataLength: 0)
      RCTInspectorNetworkReporter.reportConnectionTiming(requestId, request: request)
    }
  }

  public func didReceiveResponse(_ response: URLResponse) {
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
    storage.withLock { storage in
      guard storage.state == .started else {
        return
      }
      storage.isTextResponse = CdpNetwork.isTextContentType(headers.first { $0.key.lowercased() == "content-type" }?.value)
      RCTInspectorNetworkReporter.reportResponseStart(
        requestId,
        response: response,
        statusCode: Int32(statusCode),
        headers: headers
      )
    }
  }

  public func didReceiveData(_ data: Data) {
    storage.withLock { storage in
      guard storage.state == .started else {
        return
      }
      RCTInspectorNetworkReporter.reportDataReceived(requestId, data: data)
#if DEBUG
      // Buffered for the Network panel's response preview only.
      guard !storage.responseBodyExceedsLimit else {
        return
      }
      if storage.responseBody.count + data.count <= Self.maxResponseBodySize {
        storage.responseBody.append(data)
      } else {
        storage.responseBodyExceedsLimit = true
        storage.responseBody = Data()
      }
#endif
    }
  }

  public func didFinishLoading(encodedDataLength: Int) {
    storage.withLock { storage in
      guard storage.state == .started else {
        return
      }
      storage.state = .finished
#if DEBUG
      let body = storage.responseBodyExceedsLimit || storage.responseBody.isEmpty ? nil : storage.responseBody
      storage.responseBody = Data()
      if let body {
        if storage.isTextResponse, let text = String(data: body, encoding: .utf8) {
          EXNetworkReporterBodyStore.storeTextResponseBody(text, forRequestId: requestId)
        } else {
          RCTInspectorNetworkReporter.maybeStoreResponseBody(requestId, data: body, base64Encoded: true)
        }
      }
#endif
      RCTInspectorNetworkReporter.reportResponseEnd(requestId, encodedDataLength: Int32(clamping: encodedDataLength))
    }
  }

  public func didFailLoading(cancelled: Bool) {
    storage.withLock { storage in
      guard storage.state == .started else {
        return
      }
      storage.state = .finished
      RCTInspectorNetworkReporter.reportRequestFailed(requestId, cancelled: cancelled)
    }
  }

  private static let requestIdPropertyKey = "ExpoNetworkReporter.requestId"
}

/**
 Records a React Native DevTools network initiator from a synchronous host function.

 Hermes drops host frames when it serializes a stack, so the initiator is the JavaScript
 caller of that host function. A JavaScript wrapper around `createDevToolsRequestId()` is the
 initiator instead.
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

  /// A host function that records the initiator, then calls `implementation` with the request id ahead of
  /// the caller's arguments, so its position does not depend on how many the caller passed. That slot is
  /// `undefined` when DevTools is not attached or the id cannot be read: it only serves DevTools, so it
  /// never stops the call.
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
      let requestId = try? Self.requestId(in: runtime)
      return try Self.call(
        implementation,
        arguments: arguments,
        devToolsRequestId: requestId,
        in: runtime
      )
    }
  }

  @JavaScriptActor
  private static func call(
    _ implementation: JavaScriptValue.Ref,
    arguments: borrowing JavaScriptValuesBuffer,
    devToolsRequestId: String?,
    in runtime: JavaScriptRuntime
  ) throws -> JavaScriptValue {
    // Slot 0 stays `undefined` without an id.
    let forwarded = JavaScriptValuesBuffer.allocate(in: runtime, capacity: arguments.count + 1)
    if let devToolsRequestId {
      forwarded.emplace(JavaScriptValue(runtime, devToolsRequestId), at: 0)
    }
    for index in 0..<arguments.count {
      forwarded.emplace(arguments[index], at: index + 1)
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
