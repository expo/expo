// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import React

#if DEBUG && EX_DEV_CLIENT_NETWORK_INSPECTOR

var isHookInstalled = false

@objc(EXDevLauncherNetworkInterceptor)
public final class DevLauncherNetworkInterceptor: NSObject, ExpoRequestCdpInterceptorDelegate {
  private let metroConnection: RCTReconnectingWebSocket

  @objc
  public init(bundleUrl: URL) {
    assert(Thread.isMainThread)
    self.metroConnection = RCTReconnectingWebSocket(
      url: Self.createNetworkInspectorUrl(bundleUrl: bundleUrl),
      queue: .main)
    self.metroConnection.start()
    super.init()

    if !isHookInstalled {
      EXDevLauncherUtils.swizzleClassMethod(
        selector: #selector(getter: URLSessionConfiguration.default),
        withSelector: #selector(URLSessionConfiguration.EXDevLauncher_urlSessionConfiguration),
        forClass: URLSessionConfiguration.self
      )
      isHookInstalled = true
    }

    ExpoRequestCdpInterceptor.shared.setDelegate(self)
  }

  deinit {
    assert(Thread.isMainThread)
    ExpoRequestCdpInterceptor.shared.setDelegate(nil)
    self.metroConnection.stop()
  }

  private static func createNetworkInspectorUrl(bundleUrl: URL) -> URL {
    let host = bundleUrl.host ?? "localhost"
    let port = bundleUrl.port ?? 8081
    let scheme = bundleUrl.scheme == "https" ? "wss" : "ws"
    let urlString = "\(scheme)://\(host):\(port)/inspector/network"
    guard let url = URL(string: urlString) else {
      fatalError("Invalid network inspector URL: \(urlString)")
    }
    return url
  }

  // MARK: ExpoRequestCdpInterceptorDelegate implementations

  public func dispatch(_ event: String) {
    self.metroConnection.send(Data(event.utf8))
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
    var protocolClasses: [AnyClass] = config.protocolClasses ?? []
    if !protocolClasses.contains(where: { $0 == ExpoRequestInterceptorProtocol.self }) {
      protocolClasses.insert(ExpoRequestInterceptorProtocol.self, at: 0)
    }
    config.protocolClasses = protocolClasses
    return config
  }
}

#else

@objc(EXDevLauncherNetworkInterceptor)
public final class DevLauncherNetworkInterceptor: NSObject {
  @objc
  public init(bundleUrl: URL) {
    super.init()
  }
}

#endif
