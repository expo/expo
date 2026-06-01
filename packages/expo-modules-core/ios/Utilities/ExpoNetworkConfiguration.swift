// Copyright 2025-present 650 Industries. All rights reserved.

import Foundation

/**
 A block that supplies a custom `URLSessionConfiguration` for outgoing requests made by
 Expo modules. Return `nil` to let the module use its own default configuration.
 */
public typealias ExpoURLSessionConfigurationProvider = @convention(block) () -> URLSessionConfiguration?

/**
 A block that receives an outgoing `URLRequest` just before it is sent and returns the
 request to send instead. Use it to add headers or otherwise adjust the request. Return
 the request unchanged to leave it as-is.
 */
public typealias ExpoURLRequestModifier = @convention(block) (URLRequest) -> URLRequest

/**
 Process-wide hooks that let the host app override how Expo modules make network requests.

 Register the hooks once during app startup, before any requests are made. Two independent
 hooks are available:
 - ``setURLSessionConfigurationProvider(_:)`` to substitute the `URLSessionConfiguration`
   used to create sessions (for example to supply an mTLS-capable configuration).
 - ``setURLRequestModifier(_:)`` to adjust each outgoing request (for example to inject
   development or authentication headers).

 The hooks are consumed by Expo's networking modules (image, asset, file system, video, etc.).
 Keep any app- or framework-specific logic inside the registered blocks so the modules stay
 free of those dependencies.
 */
@objc(EXNetworkConfiguration)
public final class ExpoNetworkConfiguration: NSObject {
  private static let configurationProvider = Mutex<ExpoURLSessionConfigurationProvider?>(nil)
  private static let requestModifier = Mutex<ExpoURLRequestModifier?>(nil)

  /**
   Registers a block that supplies the `URLSessionConfiguration` Expo modules use to create
   their sessions. Pass `nil` to remove a previously registered provider.
   */
  @objc
  public static func setURLSessionConfigurationProvider(_ provider: ExpoURLSessionConfigurationProvider?) {
    configurationProvider.withLock { $0 = provider }
  }

  /**
   Registers a block that modifies each outgoing `URLRequest` before it is sent. Pass `nil`
   to remove a previously registered modifier.
   */
  @objc
  public static func setURLRequestModifier(_ modifier: ExpoURLRequestModifier?) {
    requestModifier.withLock { $0 = modifier }
  }

  /**
   Returns the configuration to use for a new session: the one from the registered provider
   if it returns a non-`nil` value, otherwise the given default.
   */
  public static func configuration(default defaultConfiguration: URLSessionConfiguration) -> URLSessionConfiguration {
    let provider = configurationProvider.withLock { $0 }
    return provider?() ?? defaultConfiguration
  }

  /**
   Returns the request to send: the one returned by the registered modifier, or the given
   request unchanged when no modifier is registered.
   */
  public static func modifiedRequest(_ request: URLRequest) -> URLRequest {
    let modifier = requestModifier.withLock { $0 }
    return modifier?(request) ?? request
  }
}
