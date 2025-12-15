import Photos

extension PHImageManager {
  func requestAVAsset(forVideo asset: PHAsset, options: PHVideoRequestOptions) async throws -> AVAsset {
    return try await withCheckedThrowingContinuation { continuation in
      requestAVAsset(forVideo: asset, options: options) { avAsset, _, _ in
        if let avAsset {
          continuation.resume(returning: avAsset)
        } else {
          continuation.resume(throwing: NSError(domain: "PHImageManagerError", code: 1))
        }
      }
    }
  }
}
