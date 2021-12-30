// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

public typealias HTTPCompletionHandler = (Data?, URLResponse?, Error?) -> Void

@objc
public class DevMenuGraphQLOptions: NSObject {
  @objc
  public let limit: Int
  @objc
  public let offset: Int

  @objc
  public init(withLimit limit: Int = 10, withOffset offset: Int = 0) {
    self.limit = limit
    self.offset = offset
  }

  @objc
  public convenience init(withOffset offset: Int) {
    self.init(withLimit: 10, withOffset: offset)
  }
}

@objc
public protocol DevMenuExpoApiClientProtocol {
  @objc
  func isLoggedIn() -> Bool

  @objc
  func setSessionSecret(_ sessionSecret: String?)

  @objc
  func queryDevSessionsAsync(_ installationID: String?, completionHandler: @escaping HTTPCompletionHandler)

  @objc
  func queryUpdateChannels(
    appId: String,
    completionHandler: @escaping ([DevMenuEASUpdates.Channel]?, URLResponse?, Error?) -> Void,
    options: DevMenuGraphQLOptions
  )

  @objc
  func queryUpdateBranches(
    appId: String,
    completionHandler: @escaping ([DevMenuEASUpdates.Branch]?, URLResponse?, Error?) -> Void,
    branchesOptions: DevMenuGraphQLOptions,
    updatesOptions: DevMenuGraphQLOptions
  )
}

public extension DevMenuExpoApiClientProtocol {
  func queryUpdateChannels(
    appId: String,
    completionHandler: @escaping ([DevMenuEASUpdates.Channel]?, URLResponse?, Error?) -> Void
  ) {
    queryUpdateChannels(appId: appId, completionHandler: completionHandler, options: DevMenuGraphQLOptions())
  }

  func queryUpdateBranches(
    appId: String,
    completionHandler: @escaping ([DevMenuEASUpdates.Branch]?, URLResponse?, Error?) -> Void
  ) {
    queryUpdateBranches(appId: appId, completionHandler: completionHandler, branchesOptions: DevMenuGraphQLOptions(), updatesOptions: DevMenuGraphQLOptions())
  }
}
