import Photos

extension PHAssetResourceManager {
  func writeData(
    for resource: PHAssetResource,
    toFile fileURL: URL,
    options: PHAssetResourceRequestOptions? = nil
  ) async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      writeData(for: resource, toFile: fileURL, options: options) { error in
        if let error {
          continuation.resume(throwing: error)
        } else {
          continuation.resume()
        }
      }
    }
  }
}
