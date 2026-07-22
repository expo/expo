// Copyright 2026-present 650 Industries. All rights reserved.

import Foundation

internal func runOnMainThread(_ operation: @escaping () -> Void) {
  if Thread.isMainThread {
    operation()
  } else {
    DispatchQueue.main.async(execute: operation)
  }
}
