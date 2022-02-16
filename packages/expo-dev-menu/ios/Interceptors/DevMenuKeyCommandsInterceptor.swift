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
    UIKeyCommand(input: "d", modifierFlags: .command, action: #selector(UIResponder.EXDevMenu_toggleDevMenu(_:))),
    UIKeyCommand(input: "l", modifierFlags: .command, action: #selector(UIResponder.EXDevMenu_navigateToLauncher(_:))),
    UIKeyCommand(input: "i", modifierFlags: .command, action: #selector(UIResponder.EXDevMenu_toggleElementInspector(_:))),
    UIKeyCommand(input: "p", modifierFlags: .command, action: #selector(UIResponder.EXDevMenu_togglePerformanceMonitor(_:))),
    UIKeyCommand(input: "r", modifierFlags: [], action: #selector(UIResponder.EXDevMenu_reload(_:))),
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
    var keyCommands = DevMenuKeyCommandsInterceptor.globalKeyCommands
    // swizzled so this is actually the default key commands
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
  
  @objc
  func EXDevMenu_navigateToLauncher(_ key: UIKeyCommand) {
    tryHandleKeyCommand(key) {
      DevMenuManager.shared.devMenuLauncherDelegate?.navigateToLauncher()
    }
  }
  
  @objc
  func EXDevMenu_toggleElementInspector(_ key: UIKeyCommand) {
    tryHandleKeyCommand(key) {
      DevMenuDevSettings.shared.toggleElementInspector()
    }
  }
  
  @objc
  func EXDevMenu_togglePerformanceMonitor(_ key: UIKeyCommand) {
    tryHandleKeyCommand(key) {
      DevMenuDevSettings.shared.togglePerformanceMonitor()
    }
  }
  
  
  @objc
  func EXDevMenu_reload(_ key: UIKeyCommand) {
    tryHandleKeyCommand(key) {
      DevMenuDevSettings.shared.reload()
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
