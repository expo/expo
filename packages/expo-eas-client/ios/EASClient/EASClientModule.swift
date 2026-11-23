// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

@ExpoModule("EASClient")
public class EASClientModule: Module {
  @JS(.cached)
  var clientID: String {
    return EASClientID.uuid().uuidString
  }

  @JS(.cached)
  var deterministicUniformValue: Double {
    return EASClientID.deterministicUniformValue(EASClientID.uuid())
  }
}
