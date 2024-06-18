// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

// swiftlint:disable redundant_optional_initialization - Initialization with nil is necessary
internal struct VideoSource: Record {
  @Field
  var uri: URL? = nil

  @Field
  var drm: DRMOptions? = nil

  @Field
  var metadata: VideoMetadata? = nil

  @Field
  var headers: [String: String]? = nil
}
// swiftlint:enable redundant_optional_initialization
