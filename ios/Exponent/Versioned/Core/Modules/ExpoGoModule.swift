// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

final class ExpoGoModule: Module {
  func definition() -> ModuleDefinition {
    Name("ExpoGoModule")

    Constants {
      return [
        "isDetached": false
      ]
    }
  }
}
