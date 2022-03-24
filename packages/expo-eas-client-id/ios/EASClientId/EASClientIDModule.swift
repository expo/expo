// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

public class EASClientIDModule: Module {
  public func definition() -> ModuleDefinition {
    name("EASClientID")
    
    asyncFunction("getClientIDAsync") {
      return EASClientID.uuid.uuidString
    }
  }
}
