// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

enum ImageCacheType: String, Enumerable {
  case none
  case disk
  case memory

  static func fromSdCacheType(_ sdImageCacheType: SDImageCacheType) -> ImageCacheType {
    switch sdImageCacheType {
    case .none:
      return .none
    case .disk, .all:
      return .disk
    case .memory:
      return .memory
    }
  }
}
