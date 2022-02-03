// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

@objc
public protocol DevMenuCallableProvider {
  @objc
  optional func registerCallable() -> DevMenuExportedCallable?
}

@objc
public class DevMenuExportedCallable: NSObject {
  @objc
  public let id: String

  @objc
  init(withId id: String) {
    self.id = id
  }
}

@objc
public class DevMenuExportedFunction: DevMenuExportedCallable {
  @objc
  public var function: ([String: Any]?) -> Void

  @objc
  public init(withId id: String, withFunction function: @escaping ([String: Any]?) -> Void) {
    self.function = function
    super.init(withId: id)
  }

  public func call(args: [String: Any]?) {
    function(args)
  }
}

@objc
public class DevMenuExportedAction: DevMenuExportedCallable {
  @objc
  public var action: () -> Void

  @objc
  public private(set) var keyCommand: UIKeyCommand?

  @objc
  public var isAvailable: () -> Bool = { true }

  @objc
  public init(withId id: String, withAction action: @escaping  () -> Void) {
    self.action = action
    super.init(withId: id)
  }

  public func call() {
    action()
  }

  @objc
  public func registerKeyCommand(input: String, modifiers: UIKeyModifierFlags) {
    keyCommand = UIKeyCommand(input: input, modifierFlags: modifiers, action: #selector(DevMenuUIResponderExtensionProtocol.EXDevMenu_handleKeyCommand(_:)))
  }
}
