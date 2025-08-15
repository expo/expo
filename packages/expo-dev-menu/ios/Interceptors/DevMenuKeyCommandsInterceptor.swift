// Copyright 2015-present 650 Industries. All rights reserved.

import UIKit
import React
import EXDevMenuInterface

class DevMenuKeyCommandsInterceptor {
  /**
   Returns bool value whether the dev menu key commands are being intercepted.
   */
  static var isInstalled: Bool = false {
    willSet {
      if isInstalled != newValue {
        if newValue {
          registerKeyCommands()
        } else {
          unregisterKeyCommands()
        }
      }
    }
  }

  static private func registerKeyCommands() {
    guard let commands = RCTKeyCommands.sharedInstance() else {
      return
    }

    commands.registerKeyCommand(
      withInput: "d",
      modifierFlags: .command,
      action: { _ in DevMenuManager.shared.toggleMenu() }
    )

    commands.registerKeyCommand(
      withInput: "d",
      modifierFlags: .control,
      action: { _ in DevMenuManager.shared.toggleMenu() }
    )

    commands.registerKeyCommand(
      withInput: "r",
      modifierFlags: [],
      action: { _ in
        DevMenuManager.shared.reload()
      }
    )

    commands.registerKeyCommand(
      withInput: "i",
      modifierFlags: .command,
      action: { _ in
        DevMenuManager.shared.toggleInspector()
      }
    )

    commands.registerKeyCommand(
      withInput: "p",
      modifierFlags: .command,
      action: { _ in
        DevMenuManager.shared.togglePerformanceMonitor()
      }
    )
  }

  static private func unregisterKeyCommands() {
    guard let commands = RCTKeyCommands.sharedInstance() else {
      return
    }

    commands.unregisterKeyCommand(withInput: "d", modifierFlags: .command)
    commands.unregisterKeyCommand(withInput: "d", modifierFlags: .control)
    commands.unregisterKeyCommand(withInput: "r", modifierFlags: [])
    commands.unregisterKeyCommand(withInput: "i", modifierFlags: .command)
    commands.unregisterKeyCommand(withInput: "p", modifierFlags: .command)
  }
}
