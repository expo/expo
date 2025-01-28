// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal class InvalidSourceException: GenericException<String> {
  override var reason: String {
    "Provided source is not a valid LivePhotoAsset: \(param)"
  }
}
