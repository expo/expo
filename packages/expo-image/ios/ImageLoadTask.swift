// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class ImageLoadTask: SharedObject {
  private let source: ImageSource
  private let maxSize: CGSize?
  private var task: Task<UIImage, any Error>?

  init(_ source: ImageSource, maxSize: CGSize? = nil) {
    self.source = source
    self.maxSize = maxSize
    super.init()
  }

  func load() async throws -> UIImage {
    let task = self.task ?? Task {
      return try await ImageLoader.shared.load(source, maxSize: maxSize)
    }
    self.task = task
    return try await task.value
  }

  func abort() {
    task?.cancel()
  }
}
