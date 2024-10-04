// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class EASClientModule: Module {
  public func definition() -> ModuleDefinition {
    Name("EASClient")

    Constants([
      "clientID": EASClientID.uuid().uuidString
    ])
  }
}
