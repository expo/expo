// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct GoogleIMA: Record {
  @Field
  var adTagUri: String? = nil

  @Field
  var id: String? = nil
}
// swiftlint:enable redundant_optional_initialization
