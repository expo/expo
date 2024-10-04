// Copyright 2015-present 650 Industries. All rights reserved.

/**
 For callsites to customize network fetch functionalities like having custom `URLSessionConfiguration`.
 */
@objc(EXFetchCustomExtension)
public class ExpoFetchCustomExtension: NSObject {
  @objc
  public static func setCustomURLSessionConfigurationProvider(_ provider: NSURLSessionConfigurationProvider?) {
    urlSessionConfigurationProvider = provider
  }
}
