// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct VideoMetadata: Record {
  @Field
  var title: String? = nil

  @Field
  var artist: String? = nil

  @Field
  var artwork: URL? = nil
}
// swiftlint:enable redundant_optional_initialization
