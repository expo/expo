import React

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
   Emits CDP `Network.requestWillBeSent` event
   */
  func emitNetworkWillBeSent(request: URLRequest, requestId: String) {
    let now = Date().timeIntervalSince1970
    let params = [
      "requestId": requestId,
      "loaderId": "",
      "documentURL": "mobile",
      "initiator": ["type": "script"],
      "redirectHasExtraInfo": false,
      "request": [
        "url": request.url?.absoluteString,
        "method": request.httpMethod,
        "headers": request.allHTTPHeaderFields
      ],
      "referrerPolicy": "no-referrer",
      "type": "Fetch",
      "timestamp": now,
      "wallTime": now
    ] as [String: Any]
    if let data = try? JSONSerialization.data(
      withJSONObject: ["method": "Network.requestWillBeSent", "params": params],
      options: []
    ), let message = String(data: data, encoding: .utf8) {
      inspectorPackagerConn?.sendWrappedEventToAllRemoteConnections(message)
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
        "headers": response.allHeaderFields
      ],
      "referrerPolicy": "no-referrer",
      "type": "Fetch",
      "timestamp": now
    ] as [String: Any]
    if let data = try? JSONSerialization.data(
      withJSONObject: ["method": "Network.responseReceived", "params": params],
      options: []
    ), let message = String(data: data, encoding: .utf8) {
      inspectorPackagerConn?.sendWrappedEventToAllRemoteConnections(message)
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
      inspectorPackagerConn?.sendWrappedEventToAllRemoteConnections(message)
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
   Sends message from native to inspector proxy
   */
  func sendWrappedEventToAllRemoteConnections(_ event: String) {
    guard let inspectorConnections =
      value(forKey: "_inspectorConnections") as? [String: RCTInspectorLocalConnection]
    else {
      return
    }
    for pageId in inspectorConnections.keys {
      perform(NSSelectorFromString("sendWrappedEvent:message:"), with: pageId, with: event)
    }
  }
}
