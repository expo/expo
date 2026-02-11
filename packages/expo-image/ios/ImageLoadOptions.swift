// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal struct ImageLoadOptions: Record {
  @Field var maxWidth: Int?
  @Field var maxHeight: Int?

  func getMaxSize() -> CGSize? {
    // If none of max dimensions are provided, just use the original image without the upper limit.
    // This is important for vector images, where using `CGSize(.max, .max)`
    // would actually try to create a bitmap of that size and cause a crash.
    if maxWidth == nil && maxHeight == nil {
      return nil
    }
    return CGSize(width: maxWidth ?? .max, height: maxHeight ?? .max)
  }
}
