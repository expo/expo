// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

public final class ContactAccessButtonModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoContactAccessButton")

    Property("isAvailable") {
      if #available(iOS 18.0, *) {
        return true
      }
      return false
    }

    View(ExpoContactAccessButton.self)
  }
}
