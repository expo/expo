// Copyright 2025-present 650 Industries. All rights reserved.

import ExpoModulesCore
import SwiftUI
import UniformTypeIdentifiers

internal final class AsyncShareableItem {
  private let queue = DispatchQueue.main
  var continuation: CheckedContinuation<URL, Error>?

  func setContinuation(_ continuation: CheckedContinuation<URL, Error>, callback: @escaping () -> Void) {
    queue.async {
      self.continuation = continuation
      callback()
    }
  }

  func resolve(with url: URL) {
    queue.async {
      self.continuation?.resume(returning: url)
      self.continuation = nil
    }
  }

  func reject(with error: Error) {
    queue.async {
      self.continuation?.resume(throwing: error)
      self.continuation = nil
    }
  }
}

internal struct AsyncShareData {
  let props: ShareLinkViewProps
  let asyncShareableItem: AsyncShareableItem
}
