// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit
import EXDevMenuInterface

class DevMenuKeyCommandsInterceptor {
  /**
   Returns bool value whether the dev menu key commands are being intercepted.
   */
  static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        // Capture touch gesture from any window by swizzling default implementation from UIWindow.
        swizzle()
      }
    }
  }

  static private func swizzle() {
    DevMenuUtils.swizzle(
      selector: #selector(getter: UIResponder.keyCommands),
      withSelector: #selector(getter: UIResponder.EXDevMenu_keyCommands),
      forClass: UIResponder.self
    )
  }

  static let globalKeyCommands: [UIKeyCommand] = [
    UIKeyCommand(input: "d", modifierFlags: .command, action: #selector(UIResponder.EXDevMenu_toggleDevMenu(_:)))
  ]
}

/**
 Extend `UIResponder` so we can put our key commands to all responders.
 */
extension UIResponder: DevMenuUIResponderExtensionProtocol {
  // NOTE: throttle the key handler because on iOS the handleKeyCommand:
  // method gets called repeatedly if the command key is held down.
  static private var lastKeyCommandExecutionTime: TimeInterval = 0
  static private var lastKeyCommand: UIKeyCommand?

  @objc
  var EXDevMenu_keyCommands: [UIKeyCommand] {
    let actions = DevMenuManager.shared.devMenuCallable.filter { $0 is DevMenuExportedAction } as! [DevMenuExportedAction]
    let actionsWithKeyCommands = actions.filter { $0.keyCommand != nil }
    var keyCommands = actionsWithKeyCommands.map { $0.keyCommand! }
    keyCommands.insert(contentsOf: DevMenuKeyCommandsInterceptor.globalKeyCommands, at: 0)
    keyCommands.append(contentsOf: self.EXDevMenu_keyCommands)
    return keyCommands
  }

  @objc
  public func EXDevMenu_handleKeyCommand(_ key: UIKeyCommand) {
    tryHandleKeyCommand(key) {
      let actions = DevMenuManager.shared.devMenuCallable.filter { $0 is DevMenuExportedAction } as! [DevMenuExportedAction]
      guard let action = actions.first(where: { $0.keyCommand == key }) else {
        return
      }

      if action.isAvailable() {
        action.call()
        DevMenuManager.shared.closeMenu()
      }
    }
  }

  @objc
  func EXDevMenu_toggleDevMenu(_ key: UIKeyCommand) {
    tryHandleKeyCommand(key) {
      DevMenuManager.shared.toggleMenu()
    }
  }

  private func shouldTriggerAction(_ key: UIKeyCommand) -> Bool {
    return UIResponder.lastKeyCommand !== key || CACurrentMediaTime() - UIResponder.lastKeyCommandExecutionTime > 0.5
  }

  private func tryHandleKeyCommand(_ key: UIKeyCommand, handler: () -> Void ) {
    if shouldTriggerAction(key) {
      handler()
      UIResponder.lastKeyCommand = key
      UIResponder.lastKeyCommandExecutionTime = CACurrentMediaTime()
    }
  }
}
