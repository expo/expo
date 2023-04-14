import React

#if DEBUG && EX_DEV_CLIENT_NETWORK_INSPECTOR

/**
 This class intercepts all default `URLSession` requests and send CDP events to the connecting metro-inspector-proxy
 */
@objc
public class EXDevLauncherNetworkLogger: NSObject {
  private var enabled: Bool = false
  internal var inspectorPackagerConn: RCTInspectorPackagerConnection?

  @objc
  public static let shared = EXDevLauncherNetworkLogger()

  override private init() {}

  @objc
  public func enable() {
    EXDevLauncherUtils.swizzleClassMethod(
      selector: #selector(RCTInspectorDevServerHelper.connect(withBundleURL:)),
      withSelector: #selector(RCTInspectorDevServerHelper.EXDevLauncher_connect(withBundleURL:)),
      forClass: RCTInspectorDevServerHelper.self
    )

    EXDevLauncherUtils.swizzleClassMethod(
      selector: #selector(getter: URLSessionConfiguration.default),
      withSelector: #selector(URLSessionConfiguration.EXDevLauncher_urlSessionConfiguration),
      forClass: URLSessionConfiguration.self
    )
    enabled = true
  }

  /**
   Emits CDP `Network.requestWillBeSent` and `Network.requestWillBeSentExtraInfo` events
   */
  func emitNetworkWillBeSent(request: URLRequest, requestId: String, redirectResponse: HTTPURLResponse?) {
    let now = Date().timeIntervalSince1970
    var requestParams: [String: Any] = [
      "url": request.url?.absoluteString,
      "method": request.httpMethod,
      "headers": request.allHTTPHeaderFields
    ]
    if let httpBody = request.httpBodyData() {
      requestParams["postData"] = String(data: httpBody, encoding: .utf8)
    }
    var params = [
      "requestId": requestId,
      "loaderId": "",
      "documentURL": "mobile",
      "initiator": ["type": "script"],
      "redirectHasExtraInfo": redirectResponse != nil,
      "request": requestParams,
      "referrerPolicy": "no-referrer",
      "type": "Fetch",
      "timestamp": now,
      "wallTime": now
    ] as [String: Any]
    if let redirectResponse {
      params["redirectResponse"] = [
        "url": redirectResponse.url?.absoluteString,
        "status": redirectResponse.statusCode,
        "statusText": "",
        "headers": redirectResponse.allHeaderFields
      ]
    }
    if let data = try? JSONSerialization.data(
      withJSONObject: ["method": "Network.requestWillBeSent", "params": params],
      options: []
    ), let message = String(data: data, encoding: .utf8) {
      inspectorPackagerConn?.sendWrappedEventToAllPages(message)
    }
    params = [
      "requestId": requestId,
      "associatedCookies": [],
      "headers": requestParams["headers"],
      "connectTiming": [
        "requestTime": now
      ]
    ] as [String: Any]
    if let data = try? JSONSerialization.data(
      withJSONObject: ["method": "Network.requestWillBeSentExtraInfo", "params": params],
      options: []
    ), let message = String(data: data, encoding: .utf8) {
      inspectorPackagerConn?.sendWrappedEventToAllPages(message)
    }
  }

  /**
   Emits CDP `Network.responseReceived` and `Network.loadingFinished` events
   */
  func emitNetworkResponse(request: URLRequest, requestId: String, response: HTTPURLResponse) {
    let now = Date().timeIntervalSince1970

    var params = [
      "requestId": requestId,
      "loaderId": "",
      "hasExtraInfo": false,
      "response": [
        "url": request.url?.absoluteString,
        "status": response.statusCode,
        "statusText": "",
        "headers": response.allHeaderFields,
        "mimeType": response.value(forHTTPHeaderField: "Content-Type") ?? ""
      ],
      "referrerPolicy": "no-referrer",
      "type": "Fetch",
      "timestamp": now
    ] as [String: Any]
    if let data = try? JSONSerialization.data(
      withJSONObject: ["method": "Network.responseReceived", "params": params],
      options: []
    ), let message = String(data: data, encoding: .utf8) {
      inspectorPackagerConn?.sendWrappedEventToAllPages(message)
    }

    params = [
      "requestId": requestId,
      "timestamp": now,
      "encodedDataLength": response.expectedContentLength
    ] as [String: Any]
    if let data = try? JSONSerialization.data(
      withJSONObject: [
        "method": "Network.loadingFinished",
        "params": params
      ],
      options: []
    ), let message = String(data: data, encoding: .utf8) {
      inspectorPackagerConn?.sendWrappedEventToAllPages(message)
    }
  }

  /**
   Emits our custom `Expo(Network.receivedResponseBody)` event
   */
  func emitNetworkDidReceiveBody(requestId: String, responseBody: Data, isText: Bool) {
    let bodyString = isText
      ? String(data: responseBody, encoding: .utf8)
      : responseBody.base64EncodedString()
    let params = [
      "requestId": requestId,
      "body": bodyString,
      "base64Encoded": !isText
    ] as [String: Any]
    if let data = try? JSONSerialization.data(
      withJSONObject: [
        "method": "Expo(Network.receivedResponseBody)",
        "params": params
      ],
      options: []
    ), let message = String(data: data, encoding: .utf8) {
      inspectorPackagerConn?.sendWrappedEventToAllPages(message)
    }
  }
}

extension URLSessionConfiguration {
  private typealias GetterFunc = @convention(c) (AnyObject, Selector) -> URLSessionConfiguration

  /**
   Swizzled `URLSessionConfiguration.default` for us to add the `EXDevLauncherRequestLoggerProtocol` interceptor
   */
  @objc
  static func EXDevLauncher_urlSessionConfiguration() -> URLSessionConfiguration {
    guard let config = try? EXDevLauncherUtils.invokeOriginalClassMethod(
      selector: #selector(getter: URLSessionConfiguration.default),
      forClass: URLSessionConfiguration.self
    ) as? URLSessionConfiguration else {
      fatalError("Unable to get original URLSessionConfiguration.default")
    }
    var protocolClasses = config.protocolClasses
    protocolClasses?.insert(EXDevLauncherRequestLoggerProtocol.self, at: 0)
    config.protocolClasses = protocolClasses
    return config
  }
}

extension RCTInspectorDevServerHelper {
  private typealias ConnectFunc = @convention(c) (AnyObject, Selector, URL)
    -> RCTInspectorPackagerConnection?

  /**
   Swizzled `RCTInspectorDevServerHelper.connect(withBundleURL:)` for us to get the `RCTInspectorPackagerConnection` instance
   */
  @objc
  static func EXDevLauncher_connect(withBundleURL bundleURL: URL)
    -> RCTInspectorPackagerConnection? {
    let inspectorPackagerConn = try? EXDevLauncherUtils.invokeOriginalClassMethod(
      selector: #selector(RCTInspectorDevServerHelper.connect(withBundleURL:)),
      forClass: RCTInspectorDevServerHelper.self,
      A0: bundleURL
    ) as? RCTInspectorPackagerConnection

    EXDevLauncherNetworkLogger.shared.inspectorPackagerConn = inspectorPackagerConn
    return inspectorPackagerConn
  }
}

extension RCTInspectorPackagerConnection {
  /**
   Indicates whether the packager connection is established and ready to send messages
   */
  func isReadyToSend() -> Bool {
    guard isConnected() else {
      return false
    }
    guard let webSocket = value(forKey: "_webSocket") as? RCTSRWebSocket else {
      return false
    }
    return webSocket.readyState == .OPEN
  }

  /**
   Sends message from native to inspector proxy
   */
  func sendWrappedEventToAllPages(_ event: String) {
    guard isReadyToSend() else {
      return
    }
    for page in RCTInspector.pages() {
      perform(NSSelectorFromString("sendWrappedEvent:message:"), with: String(page.id), with: event)
    }
  }
}

#else

@objc
public class EXDevLauncherNetworkLogger: NSObject {
  @objc
  public static let shared = EXDevLauncherNetworkLogger()

  override private init() {}

  @objc
  public func enable() {
    // no-op when running on release build where RCTInspector classes not exported
  }

  func emitNetworkWillBeSent(request: URLRequest, requestId: String, redirectResponse: HTTPURLResponse?) {
  }

  func emitNetworkResponse(request: URLRequest, requestId: String, response: HTTPURLResponse) {
  }

  func emitNetworkDidReceiveBody(requestId: String, responseBody: Data, isText: Bool) {
  }
}

#endif
