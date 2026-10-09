// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore
import Foundation

internal final class InvalidSourceException: GenericException<String> {
  override var reason: String {
    "Provided source is not a valid LivePhotoAsset: \(param)"
  }
}
