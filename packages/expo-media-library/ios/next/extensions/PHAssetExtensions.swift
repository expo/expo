import Photos

extension PHAsset {
  func requestContentEditingInput() async throws -> PHContentEditingInput {
    return try await withCheckedThrowingContinuation { continuation in
      let options = PHContentEditingInputRequestOptions()
      self.requestContentEditingInput(with: options) { contentInput, _ in
        if let contentInput {
          continuation.resume(returning: contentInput)
        } else {
          continuation.resume(throwing: NSError(domain: "PHAssetError", code: 1))
        }
      }
    }
  }
}
