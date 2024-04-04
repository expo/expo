// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal struct PlaybackError: Record {
  @Field
  // swiftlint:disable:next redundant_optional_initialization - Initialization with nil is necessary
  var message: String? = nil
}
