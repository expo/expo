// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import React

#if DEBUG && EX_DEV_CLIENT_NETWORK_INSPECTOR

var isHookInstalled = false

@objc(EXDevLauncherNetworkInterceptor)
public final class DevLauncherNetworkInterceptor: NSObject, ExpoRequestCdpInterceptorDelegate {
  fileprivate static var inspectorPackagerConn: RCTInspectorPackagerConnectionProtocol?

  public override init() {
    super.init()
    assert(Thread.isMainThread)

    if !isHookInstalled {
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
      isHookInstalled = true
    }

    ExpoRequestCdpInterceptor.shared.setDelegate(self)
  }

  deinit {
    assert(Thread.isMainThread)
    ExpoRequestCdpInterceptor.shared.setDelegate(nil)
  }

  // MARK: ExpoRequestCdpInterceptorDelegate implementations

  public func dispatch(_ event: String) {
    Self.inspectorPackagerConn?.sendWrappedEventToAllPages(event)
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
    -> RCTInspectorPackagerConnectionProtocol? {
    let inspectorPackagerConn = try? EXDevLauncherUtils.invokeOriginalClassMethod(
      selector: #selector(RCTInspectorDevServerHelper.connect(withBundleURL:)),
      forClass: RCTInspectorDevServerHelper.self,
      A0: bundleURL
    ) as? RCTInspectorPackagerConnectionProtocol

    // Exclude the connections for dev-client bundles
    if !bundleURL.absoluteString.starts(with: Bundle.main.bundleURL.absoluteString) {
      DevLauncherNetworkInterceptor.inspectorPackagerConn = inspectorPackagerConn
    }
    return inspectorPackagerConn
  }
}

extension RCTInspectorPackagerConnectionProtocol {
  /**
   Sends message from native to inspector proxy
   */
  func sendWrappedEventToAllPages(_ event: String) {
    guard isConnected() else {
      return
    }
    for page in RCTInspector.pages() where !page.title.contains("Reanimated") {
      sendWrappedEvent(toPackager: event, pageId: String(page.id))
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
}

#endif
