// Copyright 2015-present 650 Industries. All rights reserved.
import ExpoModulesCore

/**
 For callsites to customize network fetch functionalities like having custom `URLSessionConfiguration`.
 */
@objc(EXFetchCustomExtension)
public class ExpoFetchCustomExtension: NSObject {
  @MainActor @objc
  public static func setCustomURLSessionConfigurationProvider(_ provider: URLSessionConfigurationProvider?) {

    urlSessionConfigurationProvider = provider
  }
}
