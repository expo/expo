import Foundation

enum BSPatchError: Error {
  case failed(message: String)
}

struct BSPatch {
  static func applyPatch(oldPath: String,
                  newPath: String,
                  patchPath: String) throws {
    var errorBuffer = [CChar](repeating: 0, count: 256)

    let result = EXUpdatesApplyBSDiffPatch(
      oldPath.cString(using: .utf8),
      newPath.cString(using: .utf8),
      patchPath.cString(using: .utf8),
      &errorBuffer,
      256
    )

    if result != 0 {
      let message = String(cString: errorBuffer).isEmpty ?
      "BSPatch failed with code \(result)"
      : String(cString: errorBuffer)

      throw BSPatchError.failed(message: message)
    }
  }
}
