// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal struct VideoSource: Record {
  @Field
  var uri: URL?
  @Field
  var drm: DRMOptions?
}
