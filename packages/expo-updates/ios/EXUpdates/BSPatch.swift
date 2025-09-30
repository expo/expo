import Foundation

@_silgen_name("main")
func bspatch_main(_ argc: Int32, _ argv: UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>) -> Int32

struct BSPatch {
  static func applyPatch(oldPath: String,
                  newPath: String,
                  patchPath: String) throws {
    
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