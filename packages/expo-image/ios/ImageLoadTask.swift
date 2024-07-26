// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class ImageLoadTask: SharedObject {
  private let source: ImageSource
  private var task: Task<UIImage, any Error>?

  init(_ source: ImageSource) {
    self.source = source
    super.init()
  }

  func load() async throws -> UIImage {
    let task = self.task ?? Task {
      return try await ImageLoader.shared.load(source)
    }
    self.task = task
    return try await task.value
  }

  func abort() {
    task?.cancel()
  }
}
