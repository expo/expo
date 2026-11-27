// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
internal import React

/**
 Reports network requests to React Native's core network reporter (`RCTInspectorNetworkReporter`),
 which backs the React Native DevTools Network panel and the Web Performance APIs. For networking
 stacks that bypass React Native's `RCTNetworking`.

 Each request is reported under a unique id from `makeRequestId(devToolsRequestId:)`. Calls out of
 order, or after the request has finished, are ignored, and none reaches the core reporter after the
 request has finished.
 */
public final class ExpoNetworkReporter: Sendable {
  public static let shared = ExpoNetworkReporter()

  private struct Request {
    var isTextResponse = false
#if DEBUG
    private var responseBody = Data()
    private var responseBodyExceedsLimit = false

    mutating func bufferResponseBody(_ data: Data) {
      guard !responseBodyExceedsLimit else {
        return
      }
      if responseBody.count + data.count <= ExpoNetworkReporter.maxResponseBodySize {
        responseBody.append(data)
      } else {
        responseBodyExceedsLimit = true
        responseBody = Data()
      }
    }

    var bufferedResponseBody: Data? {
      return responseBodyExceedsLimit || responseBody.isEmpty ? nil : responseBody
    }
#endif
  }

  private let requests = Mutex([String: Request]())

  static let maxResponseBodySize = 1_048_576

  private init() {}

  /**
   The id to report a request under. With an id created in JS by
   `__NETWORK_REPORTER__.createDevToolsRequestId()`, DevTools shows the JS call stack as its initiator.
   */
  public static func makeRequestId(devToolsRequestId: String? = nil) -> String {
    return devToolsRequestId ?? UUID().uuidString
  }

  /**
   Marks a request as reported here, so Expo's network inspector doesn't report it a second time.
   */
  public static func mark(_ request: NSMutableURLRequest, requestId: String) {
    URLProtocol.setProperty(requestId, forKey: requestIdPropertyKey, in: request)
  }

  static func isMarked(_ request: URLRequest) -> Bool {
    return URLProtocol.property(forKey: requestIdPropertyKey, in: request) != nil
  }

  public func willSendRequest(_ requestId: String, request: URLRequest) {
    requests.withLock { requests in
      guard requests[requestId] == nil else {
        return
      }
      requests[requestId] = Request()
      RCTInspectorNetworkReporter.reportRequestStart(requestId, request: request, encodedDataLength: 0)
      RCTInspectorNetworkReporter.reportConnectionTiming(requestId, request: request)
    }
  }

  public func willFollowRedirect(_ requestId: String, request: URLRequest, redirectResponse: HTTPURLResponse) {
    requests.withLock { requests in
      guard requests[requestId] != nil else {
        return
      }
      RCTInspectorNetworkReporter.reportRequestStart(
        requestId,
        request: request,
        encodedDataLength: 0,
        redirectResponse: redirectResponse
      )
    }
  }

  public func didReceiveResponse(_ requestId: String, response: URLResponse) {
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
    let isTextResponse = CdpNetwork.isTextContentType(headers.first { $0.key.lowercased() == "content-type" }?.value)
    requests.withLock { requests in
      guard requests[requestId] != nil else {
        return
      }
      requests[requestId]?.isTextResponse = isTextResponse
      RCTInspectorNetworkReporter.reportResponseStart(
        requestId,
        response: response,
        statusCode: Int32(statusCode),
        headers: headers
      )
    }
  }

  public func didReceiveData(_ requestId: String, data: Data) {
    requests.withLock { requests in
      guard requests[requestId] != nil else {
        return
      }
      RCTInspectorNetworkReporter.reportDataReceived(requestId, data: data)
#if DEBUG
      requests[requestId]?.bufferResponseBody(data)
#endif
    }
  }

  public func didFinishLoading(_ requestId: String, encodedDataLength: Int) {
    guard let request = requests.withLock({ $0.removeValue(forKey: requestId) }) else {
      return
    }
    storeResponseBody(of: request, requestId: requestId)
    RCTInspectorNetworkReporter.reportResponseEnd(requestId, encodedDataLength: Int32(clamping: encodedDataLength))
  }

  public func didFailLoading(_ requestId: String, cancelled: Bool) {
    guard requests.withLock({ $0.removeValue(forKey: requestId) }) != nil else {
      return
    }
    RCTInspectorNetworkReporter.reportRequestFailed(requestId, cancelled: cancelled)
  }

  private func storeResponseBody(of request: Request, requestId: String) {
#if DEBUG
    guard let body = request.bufferedResponseBody else {
      return
    }
    if request.isTextResponse, let text = String(data: body, encoding: .utf8) {
      RCTInspectorNetworkReporter.maybeStoreResponseBody(requestId, body: text)
    } else {
      RCTInspectorNetworkReporter.maybeStoreResponseBody(requestId, data: body, base64Encoded: true)
    }
#endif
  }

  private static let requestIdPropertyKey = "ExpoNetworkReporter.requestId"
}
