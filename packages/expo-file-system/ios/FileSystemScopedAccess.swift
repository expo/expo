// Copyright 2024-present 650 Industries. All rights reserved.

import Foundation
import ExpoModulesCore

internal final class FileSystemScopedAccess {
  private let url: URL
  private let didStartAccessing: Bool

  init(url: URL) {
    self.url = url
    didStartAccessing = url.startAccessingSecurityScopedResource()
  }

  deinit {
    if didStartAccessing {
      url.stopAccessingSecurityScopedResource()
    }
  }
}

internal func makeScopedAccess(for path: FileSystemPath, permission: FileSystemPermissionFlags) throws -> FileSystemScopedAccess {
  try path.withCorrectTypeAndScopedAccess(permission: permission) {
    FileSystemScopedAccess(url: path.url)
  }
}
