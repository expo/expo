// Copyright 2023-present 650 Industries. All rights reserved.

import ExpoModulesCore

internal final class ImageLoadTask: SharedObject {
  private let source: ImageSource
  private var task: Task<UIImage?, Never>?

  init(_ source: ImageSource) {
    self.source = source
    super.init()
  }

  func load() async -> UIImage? {
    if task == nil {
      task = Task {
        return await ImageLoader.shared.load(source)
      }
    }
    return await task?.value
  }

  func abort() {
    task?.cancel()
  }
}
