import Photos
import ExpoModulesCore

extension PHPhotoLibrary {
  func performChanges(_ changeBlock: @escaping () throws -> Void) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      var changeBlockFailed = false
      performChanges({
        do {
          try changeBlock()
        } catch {
          changeBlockFailed = true
          continuation.resume(throwing: error)
        }
      }, completionHandler: { success, error in
        guard !changeBlockFailed else {
          return
        }

        if success {
          continuation.resume(returning: ())
        } else if let error = error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume(throwing: NSError(
            domain: "PHPhotoLibrary",
            code: -1,
            userInfo: [NSLocalizedDescriptionKey: "Unknown photo library error"]
          ))
        }
      })
    }
  }
}
