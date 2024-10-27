// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct ImageLoadOptions: Record {
  @Field var maxWidth: Int = .max
  @Field var maxHeight: Int = .max

  func getMaxSize() -> CGSize {
    return CGSize(width: maxWidth, height: maxHeight)
  }
}
