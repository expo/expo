// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

internal func runOnMainThread(_ operation: @escaping @MainActor () -> Void) {
  if Thread.isMainThread {
    MainActor.assumeIsolated { operation() }
  } else {
    DispatchQueue.main.async(execute: operation)
  }
}
