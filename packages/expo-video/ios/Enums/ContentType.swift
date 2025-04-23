// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import CoreMedia

internal enum ContentType: String, Enumerable {
  case auto
  case progressive
  case hls
  case dash
  case smoothStreaming
}
