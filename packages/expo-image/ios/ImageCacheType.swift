// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

enum ImageCacheType: Int, EnumArgument {
  case unknown = 0
  case none = 1
  case disk = 2
  case memory = 3

  static func fromSdCacheType(_ sdImageCacheType: SDImageCacheType) -> ImageCacheType {
    switch sdImageCacheType {
    case .none:
      return .none
    case .disk:
      return .disk
    case .memory:
      return .memory
    default:
      return .unknown
    }
  }
}
