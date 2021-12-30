// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuManagerProviderProtocol {
  @objc
  func getDevMenuManager() -> DevMenuManagerProtocol
}
