// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

/**
 For callsites to customize network fetch functionalities like having custom `URLSessionConfiguration`.
 */
@objc(EXFetchCustomExtension)
public class ExpoFetchCustomExtension: NSObject {
  @MainActor @objc
  public static func setCustomURLSessionConfigurationProvider(_ provider: NSURLSessionConfigurationProvider?) {
    urlSessionConfigurationProvider = provider
  }

  /**
   Set a custom factory that creates the URLSession used by ExpoFetchModule.
   The factory receives the `URLSessionSessionDelegateProxy` which must be used as the session's delegate.
   Consumers can set `authenticationChallengeDelegate` on the proxy to handle auth challenges like mTLS.
   Takes precedence over `setCustomURLSessionConfigurationProvider`.
   */
  @MainActor
  public static func setCustomURLSessionFactory(
    _ factory: ((_ delegateProxy: URLSessionSessionDelegateProxy) -> URLSession)?
  ) {
    urlSessionFactory = factory
  }

  /**
   Recreates the URLSession used by ExpoFetchModule, destroying all cached TLS sessions.
   Call this after configuring new credentials to ensure the next request triggers a fresh TLS handshake.
   */
  public static func recreateURLSession() {
    requestURLSessionRecreation()
  }
}
