// Copyright 2015-present 650 Industries. All rights reserved.

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
