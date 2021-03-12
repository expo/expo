// Copyright 2015-present 650 Industries. All rights reserved.

public typealias HTTPCompletionHandler = (Data?, URLResponse?, Error?) -> Void

@objc
public protocol DevMenuExpoApiClientProtocol {
  @objc
  func isLoggedIn() -> Bool
  
  @objc
  func setSessionSecret(_ sessionSecret: String?)
  
  @objc
  func queryDevSessionsAsync(_ completionHandler: @escaping HTTPCompletionHandler)
}
