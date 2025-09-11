import Photos

extension URL {
  /*
   * When the URL is of PHAsset type (ph://) this method returns a URL that has access permissions to show the Asset.
   * This is a bit of a hack, we have to use `requestAVAsset` to avoid permission exceptions, but `requestAVAsset` can not return a `VideoAsset`
   * which we have to use, and we can't easily turn the `AVURLAsset` returned into a `VideoAsset` as well.
   * Once we request an AVAsset for a PHAsset url, the URI of the asset returned by `requestAVAsset` has a valid sandbox key and can be used
   * in different AVAssets. Therefore we can use this method to get a valid URL and use it to create a `VideoAsset`. We never start
   * loading the `AVURLAsset` from `requestAVAsset` so the cost of creating a new asset should be negligible.
   */
  func toUrlWithPermissions() async throws -> URL? {
    if !isPHAssetUrl {
      return self
    }

    let unlockedAsset = try await PHImageManager.default().requestAVAsset(forURL: self)

    guard let accessibleUrl = (unlockedAsset as? AVURLAsset)?.url else {
      throw PlayerItemLoadException("Failed to request a usable AVAsset for \(self.absoluteString)")
    }

    return accessibleUrl
  }
}

internal extension URL {
  var isPHAssetUrl: Bool {
    return self.absoluteString.hasPrefix("ph://")
  }
}

private extension PHImageManager {
  func requestAVAsset(forURL url: URL) async throws -> AVAsset? {
    let localIdentifier = url.absoluteString.replacingOccurrences(of: "ph://", with: "")
    let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [localIdentifier], options: nil)
    let options = PHVideoRequestOptions()
    options.isNetworkAccessAllowed = true // Allow downloading from iCloud if needed

    guard let phAsset = fetchResult.firstObject else {
      throw PlayerItemLoadException("The provided URL: \(url), is not a valid PHAsset URL")
    }

    return try await self.requestAVAsset(forVideoAsset: phAsset, options: options)
  }

  func requestAVAsset(forVideoAsset asset: PHAsset, options: PHVideoRequestOptions?) async throws -> AVAsset? {
    let assetId = asset.localIdentifier

    return try await withCheckedThrowingContinuation { continuation in
      self.requestAVAsset(forVideo: asset, options: options) { asset, _, info in
        let urlString = "ph://\(assetId)"

        if let cancelled = info?[PHImageCancelledKey] as? Bool, cancelled {
          continuation.resume(throwing: PlayerItemLoadException("Loading request cancelled for \(urlString)"))
          return
        }

        if let error = info?[PHImageErrorKey] as? Error {
          continuation.resume(throwing: PlayerItemLoadException("Failed to request an AVAsset for \(urlString): \(error.localizedDescription)"))
        }

        continuation.resume(returning: asset)
      }
    }
  }
}
