// Copyright 2015-present 650 Industries. All rights reserved.

import Foundation

enum BSPatchError: Error {
  case failed(message: String)
}

struct BSPatch {
  static func applyPatch(
    oldPath: String,
    newPath: String,
    patchPath: String
  ) throws {
    guard let oldPath = oldPath.cString(using: .utf8),
      let newPath = newPath.cString(using: .utf8),
      let patchPath = patchPath.cString(using: .utf8) else {
      throw BSPatchError.failed(message: "Invalid file path provided.")
    }

    let result = EXUpdatesApplyBSDiffPatch(
      oldPath,
      newPath,
      patchPath
    )

    if result != 0 {
      throw BSPatchError.failed(message: "BSPatch failed with code \(result)")
    }
  }
}
