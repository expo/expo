// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
internal import React

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
