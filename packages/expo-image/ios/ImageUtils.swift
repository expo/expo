// Copyright 2022-present 650 Industries. All rights reserved.

import SDWebImage
import ExpoModulesCore

func cacheTypeToString(_ cacheType: SDImageCacheType) -> String {
  switch cacheType {
  case .none:
    return "none"
  case .disk:
    return "disk"
  case .memory, .all:
    // `all` doesn't make much sense, so we treat it as `memory`.
    return "memory"
  }
}

func imageFormatToMediaType(_ format: SDImageFormat) -> String? {
  switch format {
  case .undefined:
    return nil
  case .JPEG:
    return "image/jpeg"
  case .PNG:
    return "image/png"
  case .GIF:
    return "image/gif"
  case .TIFF:
    return "image/tiff"
  case .webP:
    return "image/webp"
  case .HEIC:
    return "image/heic"
  case .HEIF:
    return "image/heif"
  case .PDF:
    return "application/pdf"
  case .SVG:
    return "image/svg+xml"
  default:
    // On one hand we could remove this clause and always ensure that we have handled
    // all supported formats (by erroring compilation otherwise).
    // On the other hand, we do support overriding SDWebImage version,
    // so we shouldn't fail to compile on SDWebImage versions with.
    return nil
  }
}
