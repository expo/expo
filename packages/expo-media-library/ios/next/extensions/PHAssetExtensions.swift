import Photos

extension PHAsset {
  func requestContentEditingInput(
    options: PHContentEditingInputRequestOptions = PHContentEditingInputRequestOptions()
  ) async throws -> (input: PHContentEditingInput?, info: [AnyHashable: Any]?) {
    return try await withCheckedThrowingContinuation { continuation in
      self.requestContentEditingInput(with: options) { contentInput, info in
        continuation.resume(returning: (input: contentInput, info: info))
      }
    }
  }
}
