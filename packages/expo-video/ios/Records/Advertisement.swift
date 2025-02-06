// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct Advertisement: Record {
  @Field
  var googleIMA: GoogleIMA? = nil
}
// swiftlint:enable redundant_optional_initialization
