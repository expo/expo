// Copyright 2015-present 650 Industries. All rights reserved.

/**
 For callsites to customize network fetch functionalities like having custom `URLSessionConfiguration`.
 */
@objc(EXNetworkFetchCustomExtension)
public class ExpoNetworkFetchCustomExtension: NSObject {
  @objc
  public static func setCustomURLSessionConfigurationProvider(_ provider: NSURLSessionConfigurationProvider?) {
    urlSessionConfigurationProvider = provider
  }
}
