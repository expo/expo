// Copyright 2015-present 650 Industries. All rights reserved.

#if os(iOS) || os(tvOS)
import Foundation
import UIKit

@objc
public protocol DevMenuUIResponderExtensionProtocol {
  @objc
  func EXDevMenu_handleKeyCommand(_ key: UIKeyCommand)
}

#endif
