import Foundation

@_silgen_name("main")
func bspatch_main(_ argc: Int32, _ argv: UnsafeMutablePointer<UnsafeMutablePointer<CChar>?>) -> Int32

internal class BSPatch {
  static func applyPatch(oldFilePath: String, newFilePath: String, patchFilePath: String) -> Int32 {
    return oldFilePath.withCString { oldFile in
      newFilePath.withCString { newFile in
        patchFilePath.withCString { patchFile in
          let argv: [UnsafeMutablePointer<CChar>?] = [
            strdup("bspatch"),
            strdup(oldFile),
            strdup(newFile),
            strdup(patchFile),
            nil
          ]

          defer {
            for i in 0..<4 {
              free(argv[i])
            }
          }

          return argv.withUnsafeBufferPointer { buffer in
            guard let baseAddress = buffer.baseAddress else { return -1 }
            return bspatch_main(4, UnsafeMutablePointer(mutating: baseAddress))
          }
        }
      }
    }
  }
}
