// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct SubtitleSource: Record {
  @Field
  var uri: URL? = nil

  @Field
  var language: String? = nil

  @Field
  var label: String? = nil
}
// swiftlint:enable redundant_optional_initialization
