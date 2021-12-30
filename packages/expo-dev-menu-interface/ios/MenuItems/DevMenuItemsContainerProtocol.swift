// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuItemsContainerProtocol {
  @objc
  func getRootItems() -> [DevMenuScreenItem]

  @objc
  func getAllItems() -> [DevMenuScreenItem]
}
