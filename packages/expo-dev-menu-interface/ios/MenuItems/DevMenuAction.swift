// Copyright 2015-present 650 Industries. All rights reserved.

@objc
open class DevMenuAction: DevMenuItem {
  @objc
  public let actionId: String

  @objc
  public var action: () -> () = {}

  @objc
  public var keyCommand: UIKeyCommand?

  @objc
  public init(withId id: String) {
    self.actionId = id
    super.init(type: .Action)
  }

  @objc
  public convenience init(withId id: String, action: @escaping () -> ()) {
    self.init(withId: id)
    self.action = action
  }

  @objc
  open override func serialize() -> [String : Any] {
    var dict = super.serialize()
    dict["actionId"] = actionId
    dict["keyCommand"] = keyCommand == nil ? nil : [
      "input": keyCommand!.input,
      "modifiers": keyCommand!.modifierFlags.rawValue
    ]
    return dict
  }

  @objc
  open func registerKeyCommand(input: String, modifiers: UIKeyModifierFlags) {
    keyCommand = UIKeyCommand(input: input, modifierFlags: modifiers, action: #selector(DevMenuUIResponderExtensionProtocol.EXDevMenu_handleKeyCommand(_:)))
  }
}
