// Copyright 2015-present 650 Industries. All rights reserved.

import ExpoModulesCore

@ExpoModule("EASClient")
public class EASClientModule: Module {
  @JS
  lazy var clientID: String = EASClientID.uuid().uuidString

  @JS
  lazy var deterministicUniformValue: Double = EASClientID.deterministicUniformValue(EASClientID.uuid())
}
