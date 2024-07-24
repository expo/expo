// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore
import React

#if DEBUG && EX_DEV_CLIENT_NETWORK_INSPECTOR

var isHookInstalled = false

@objc(EXDevLauncherNetworkInterceptor)
public final class DevLauncherNetworkInterceptor: NSObject, ExpoRequestCdpInterceptorDelegate {
  fileprivate static var inspectorPackagerConn: RCTInspectorPackagerConnection?

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
    -> RCTInspectorPackagerConnection? {
    let inspectorPackagerConn = try? EXDevLauncherUtils.invokeOriginalClassMethod(
      selector: #selector(RCTInspectorDevServerHelper.connect(withBundleURL:)),
      forClass: RCTInspectorDevServerHelper.self,
      A0: bundleURL
    ) as? RCTInspectorPackagerConnection

    // Exclude the connections for dev-client bundles
    if !bundleURL.absoluteString.starts(with: Bundle.main.bundleURL.absoluteString) {
      DevLauncherNetworkInterceptor.inspectorPackagerConn = inspectorPackagerConn
    }
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
    guard let webSocket = value(forKey: "_webSocket") as? AnyObject,
      let readyState = webSocket.value(forKey: "readyState") as? Int else {
      return false
    }
    // To support both RCTSRWebSocket (RN < 0.72) and SRWebSocket (RN >= 0.72)
    // and not to introduce extra podspec dependencies,
    // we use the internal and hardcoded value here.
    // Given the fact that both RCTSRWebSocket and SRWebSocket has the readyState property
    // and the open state is 1.
    let OPEN_STATE = 1
    return readyState == OPEN_STATE
  }

  /**
   Sends message from native to inspector proxy
   */
  func sendWrappedEventToAllPages(_ event: String) {
    guard isReadyToSend() else {
      return
    }
    for page in RCTInspector.pages() where !page.title.contains("Reanimated") {
      perform(NSSelectorFromString("sendWrappedEvent:message:"), with: String(page.id), with: event)
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
