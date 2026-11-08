// Copyright 2024-present 650 Industries. All rights reserved.

import AVFoundation

func resolveNowPlayingMetadataValue(userValue: String?, assetValue: AVMetadataItem?) async -> String? {
  if let userValue {
    return userValue
  }
  return try? await assetValue?.load(.stringValue)
}
