import Photos

extension PHImageManager {
  func requestAVAsset(
    forVideo asset: PHAsset,
    options: PHVideoRequestOptions
  ) async throws -> (asset: AVAsset?, info: [AnyHashable: Any]?) {
    return try await withCheckedThrowingContinuation { continuation in
      requestAVAsset(forVideo: asset, options: options) { avAsset, _, info in
        continuation.resume(returning: (asset: avAsset, info: info))
      }
    }
  }

  func requestLivePhoto(for asset: PHAsset, options: PHLivePhotoRequestOptions) async throws -> PHLivePhoto? {
    return try await withCheckedThrowingContinuation { continuation in
      requestLivePhoto(
        for: asset,
        targetSize: PHImageManagerMaximumSize,
        contentMode: .aspectFit,
        options: options
      ) { livePhoto, info in
        // According to the Photos documentation, this callback may be called multiple times and degraded results are temporary low-quality placeholders.
        if Self.isDegradedResult(info) {
          return
        }
        continuation.resume(returning: livePhoto)
      }
    }
  }

  private static func isDegradedResult(_ info: [AnyHashable: Any]?) -> Bool {
    info?[PHImageResultIsDegradedKey] as? Bool ?? false
  }
}
