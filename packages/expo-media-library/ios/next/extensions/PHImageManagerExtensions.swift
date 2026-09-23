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
    // According to the Photos documentation, the requestLivePhoto callback may be called multiple times if this option is not set
    options.deliveryMode = .highQualityFormat
    return try await withCheckedThrowingContinuation { continuation in
      requestLivePhoto(
        for: asset,
        targetSize: PHImageManagerMaximumSize,
        contentMode: .aspectFit,
        options: options
      ) { livePhoto, _ in
        continuation.resume(returning: livePhoto)
      }
    }
  }
}
