// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct VolumeEvent: Record {
  @Field
  var volume: Float? = nil

  @Field
  var isMuted: Bool? = nil
}
// swiftlint:enable redundant_optional_initialization
