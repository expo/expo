// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation
import Photos
import PhotosUI

// Live photo only supports two content modes
internal enum ContentFit: String, Enumerable {
  case contain
  case cover

  func toContentMode() -> PHImageContentMode {
    switch self {
    case .contain:
      return PHImageContentMode.aspectFit
    case .cover:
      return PHImageContentMode.aspectFill
    }
  }
}

internal enum PlaybackStyle: String, Enumerable {
  case full
  case hint

  func toLivePhotoViewPlaybackStyle() -> PHLivePhotoViewPlaybackStyle {
    switch self {
    case .full:
      return .full
    case .hint:
      return .hint
    }
  }
}
