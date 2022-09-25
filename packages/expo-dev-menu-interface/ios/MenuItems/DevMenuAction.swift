// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation
import UIKit

@objc
open class DevMenuAction: DevMenuScreenItem, DevMenuCallableProvider {
  @objc
  public var callable: DevMenuExportedAction

  @objc
  public var action: () -> Void {
    get { return self.callable.action }
    set { self.callable.action = newValue }
  }

  @objc
  open var isAvailable: () -> Bool {
    get {
      return self.callable.isAvailable
    }
    set {
      self.callable.isAvailable = newValue
    }
  }

  @objc
  open var isEnabled: () -> Bool = { false }

  @objc
  open var label: () -> String = { "" }

  @objc
  open var detail: () -> String = { "" }

  @objc
  open var glyphName: () -> String = { "" }

  @objc
  public init(withId id: String) {
    self.callable = DevMenuExportedAction(withId: id, withAction: {})
    super.init(type: .Action)
  }

  @objc
  public convenience init(withId id: String, action: @escaping () -> Void) {
    self.init(withId: id)
    self.callable.action = action
  }

  @objc
  public convenience init(withId id: String, _ action: @escaping () -> Void) {
    self.init(withId: id, action: action)
  }

  public func registerCallable() -> DevMenuExportedCallable? {
    return self.callable
  }

  @objc
  open func registerKeyCommand(input: String, modifiers: UIKeyModifierFlags) {
    self.callable.registerKeyCommand(input: input, modifiers: modifiers)
  }

  @objc
  open override func serialize() -> [String: Any] {
    var dict = super.serialize()
    dict["actionId"] = self.callable.id
    dict["keyCommand"] = self.callable.keyCommand == nil ? nil : [
      "input": self.callable.keyCommand!.input!,
      "modifiers": exportKeyCommandModifiers()
    ]

    dict["isAvailable"] = isAvailable()
    dict["isEnabled"] = isAvailable()
    dict["label"] = label()
    dict["detail"] = detail()
    dict["glyphName"] = glyphName()

    return dict
  }

  private func exportKeyCommandModifiers() -> Int {
    var exportedValue = 0
    let keyCommand = self.callable.keyCommand!

    if keyCommand.modifierFlags.contains(.control) {
      exportedValue += 1 << 0
    }

    if keyCommand.modifierFlags.contains(.alternate) {
      exportedValue += 1 << 1
    }

    if keyCommand.modifierFlags.contains(.command) {
      exportedValue += 1 << 2
    }

    if keyCommand.modifierFlags.contains(.shift) {
      exportedValue += 1 << 3
    }

    return exportedValue
  }
}
