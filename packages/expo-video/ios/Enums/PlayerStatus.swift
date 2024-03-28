// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal enum PlayerStatus: String, Enumerable {
  case idle
  case loading
  case readyToPlay
  case error
}
