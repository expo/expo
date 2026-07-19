// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuBridgeProtocol {
  @objc
  optional func module(forName: String) -> AnyObject?

  @objc
  optional func modulesConforming(toProtocol: Protocol) -> [AnyObject]

  @objc
  optional func requestReload()
}
