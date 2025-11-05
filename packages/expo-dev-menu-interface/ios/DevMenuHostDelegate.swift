// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

@objc
public protocol DevMenuHostDelegate: NSObjectProtocol {
  /**
   Optional function to navigate the host application to its home screen.
   */
  @objc optional func devMenuNavigateHome()
}
