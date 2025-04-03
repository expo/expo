// Copyright 2024-present 650 Industries. All rights reserved.
import ExpoModulesCore

enum BackgroundTaskStatus: Int, Enumerable {
  case restricted = 1
  case available = 2
}

enum BackgroundTaskResult: Int, Enumerable {
  case success = 1
  case failed = 2
}
