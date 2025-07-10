// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct FullscreenOptions: Record {
  @Field
  var enable: Bool = true
  @Field
  var orientation: FullscreenOrientation = FullscreenOrientation.default
  @Field
  var autoExitOnRotate: Bool = false
}
