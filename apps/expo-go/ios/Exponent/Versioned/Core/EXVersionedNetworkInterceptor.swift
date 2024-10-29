// Copyright 2015-present 650 Industries. All rights reserved.

import Expo
import ExpoModulesCore
import React

@objc(EXVersionedNetworkInterceptor)
internal final class EXVersionedNetworkInterceptor: NSObject, ExpoRequestCdpInterceptorDelegate {
  private let metroConnection: RCTReconnectingWebSocket

  @objc
  init(bundleUrl: URL) {
    assert(Thread.isMainThread)
    self.metroConnection = RCTReconnectingWebSocket(
      url: Self.createNetworkInspectorUrl(bundleUrl: bundleUrl),
      queue: .main)
    self.metroConnection.start()
    super.init()

    RCTSetCustomNSURLSessionConfigurationProvider {
      return self.createDefaultURLSessionConfiguration()
    }

    ExpoFetchCustomExtension.setCustomURLSessionConfigurationProvider {
      return self.createDefaultURLSessionConfiguration()
    }

    ExpoRequestCdpInterceptor.shared.setDelegate(self)
  }

  private func createDefaultURLSessionConfiguration() -> URLSessionConfiguration {
    let config = URLSessionConfiguration.default

    var protocolClasses: [AnyClass] = config.protocolClasses ?? []
    if !protocolClasses.contains(where: { $0 == ExpoRequestInterceptorProtocol.self }) {
      protocolClasses.insert(ExpoRequestInterceptorProtocol.self, at: 0)
    }

    config.protocolClasses = protocolClasses
    config.httpShouldSetCookies = true
    config.httpCookieAcceptPolicy = .always
    config.httpCookieStorage = HTTPCookieStorage.shared
    return config
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

  // MARK: - EXRequestCdpInterceptorDelegate implementations

  func dispatch(_ event: String) {
    self.metroConnection.send(Data(event.utf8))
  }
}
