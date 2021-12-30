// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuConstructibleFromDictionary {
  @objc
  init(dictionary: [String: Any])
}

public struct DevMenuEASUpdates {
  @objc
  public class Channel: NSObject, DevMenuConstructibleFromDictionary {
    public let id: String
    public let name: String
    public let createdAt: String
    public let updatedAt: String

    required public init(dictionary: [String: Any]) {
      id = dictionary["id"] as! String
      name = dictionary["name"] as! String
      createdAt = dictionary["createdAt"] as! String
      updatedAt = dictionary["updatedAt"] as! String
    }
  }

  @objc
  public class Branch: NSObject, DevMenuConstructibleFromDictionary {
    public let id: String
    public let updates: [Update]

    required public init(dictionary: [String: Any]) {
      id = dictionary["id"] as! String
      let updatesData = dictionary["updates"] as? [[String: Any]] ?? []
      updates = updatesData.map { Update(dictionary: $0) }
    }
  }

  @objc
  public class Update: NSObject, DevMenuConstructibleFromDictionary {
    public let id: String
    public let message: String
    public let platform: String
    public let runtimeVersion: String
    public let createdAt: String
    public let updatedAt: String

    required public init(dictionary: [String: Any]) {
      id = dictionary["id"] as! String
      message = dictionary["message"] as! String
      platform = dictionary["platform"] as! String
      runtimeVersion = dictionary["runtimeVersion"] as! String
      createdAt = dictionary["createdAt"] as! String
      updatedAt = dictionary["updatedAt"] as! String
    }
  }
}
