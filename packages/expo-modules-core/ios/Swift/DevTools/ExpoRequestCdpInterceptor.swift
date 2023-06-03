// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

/**
 The `ExpoRequestInterceptorProtocolDelegate` implementation to
 dispatch CDP (Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/) events.
 */
@objc(EXRequestCdpInterceptor)
public final class ExpoRequestCdpInterceptor: NSObject, ExpoRequestInterceptorProtocolDelegate {
  private var delegate: ExpoRequestCdpInterceptorDelegate?
  internal var dispatchQueue = DispatchQueue(label: "expo.requestCdpInterceptor")

  override private init() {}

  @objc
  public static let shared = ExpoRequestCdpInterceptor()

  @objc
  public func setDelegate(_ newValue: ExpoRequestCdpInterceptorDelegate?) {
    dispatchQueue.async {
      self.delegate = newValue
    }
  }

  private func dispatchEvent<T: CdpNetwork.EventParms>(_ event: CdpNetwork.Event<T>) {
    dispatchQueue.async {
      let encoder = JSONEncoder()
      if let jsonData = try? encoder.encode(event), let payload = String(data: jsonData, encoding: .utf8) {
        self.delegate?.dispatch(payload)
      }
    }
  }

  // MARK: ExpoRequestInterceptorProtocolDelegate implementations

  func willSendRequest(requestId: String, request: URLRequest, redirectResponse: HTTPURLResponse?) {
    let now = Date().timeIntervalSince1970

    let params = CdpNetwork.RequestWillBeSentParams(now: now, requestId: requestId, request: request, redirectResponse: redirectResponse)
    dispatchEvent(CdpNetwork.Event(method: "Network.requestWillBeSent", params: params))

    let params2 = CdpNetwork.RequestWillBeSentExtraInfoParams(now: now, requestId: requestId, request: request)
    dispatchEvent(CdpNetwork.Event(method: "Network.requestWillBeSentExtraInfo", params: params2))
  }

  func didReceiveResponse(requestId: String, request: URLRequest, response: HTTPURLResponse) {
    let now = Date().timeIntervalSince1970

    let params = CdpNetwork.ResponseReceivedParams(now: now, requestId: requestId, request: request, response: response)
    dispatchEvent(CdpNetwork.Event(method: "Network.responseReceived", params: params))

    let params2 = CdpNetwork.LoadingFinishedParams(now: now, requestId: requestId, request: request, response: response)
    dispatchEvent(CdpNetwork.Event(method: "Network.loadingFinished", params: params2))
  }

  func didReceiveResponseBody(requestId: String, responseBody: Data, isText: Bool) {
    let now = Date().timeIntervalSince1970
    let params = CdpNetwork.ExpoReceivedResponseBodyParams(now: now, requestId: requestId, responseBody: responseBody, isText: isText)
    dispatchEvent(CdpNetwork.Event(method: "Expo(Network.receivedResponseBody)", params: params))
  }
}

/**
 The delegate to dispatch CDP events for ExpoRequestCdpInterceptor
 */
@objc(EXRequestCdpInterceptorDelegate)
public protocol ExpoRequestCdpInterceptorDelegate {
  @objc
  func dispatch(_ event: String)
}
