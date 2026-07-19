// Copyright 2024-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class ImageLoadTask: SharedObject {
  private let source: ImageSource
  private let options: ImageLoadOptions
  private var task: Task<UIImage, any Error>?

  init(_ source: ImageSource, options: ImageLoadOptions) {
    self.source = source
    self.options = options
    super.init()
  }

  func load() async throws -> UIImage {
    let task = self.task ?? Task { [source, options] in
      return try await ImageLoader.shared.load(source, options: options)
    }
    self.task = task
    return try await task.value
  }

  func abort() {
    task?.cancel()
  }
}
