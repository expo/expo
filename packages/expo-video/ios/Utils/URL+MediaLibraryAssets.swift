import Photos

extension URL {
  /*
   * When the URL if of PHAsset type (ph://) this method returns an URL that has access permissions to show the Asset.
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

    let unlockedAsset = try await requestAVAsset(url: self)

    guard let accessibleUrl = (unlockedAsset as? AVURLAsset)?.url else {
      throw PlayerItemLoadException("Failed to request a usable AVAsset for \(self.absoluteString)")
    }

    return accessibleUrl
  }
}

private func requestAVAsset(url: URL) async throws -> AVAsset? {
  let localIdentifier = url.absoluteString.replacingOccurrences(of: "ph://", with: "")
  let fetchResult = PHAsset.fetchAssets(withLocalIdentifiers: [localIdentifier], options: nil)
  let options = PHVideoRequestOptions()
  options.isNetworkAccessAllowed = true // Allow downloading from iCloud if needed

  guard let phAsset = fetchResult.firstObject else {
    throw PlayerItemLoadException("The provided URL: \(url), is not a valid PHAsset URL")
  }

  let requestResult = await PHImageManager.default().requestAvAsset(forVideo: phAsset, options: options)
  if let cancelled = requestResult.info?[PHImageCancelledKey] as? Bool, cancelled {
    throw PlayerItemLoadException("Loading request cancelled for \(url.absoluteString)")
  }

  if let error = requestResult.info?[PHImageErrorKey] as? Error {
    throw PlayerItemLoadException("Failed to request an AVAsset for \(url.absoluteString): \(error.localizedDescription)")
  }

  return requestResult.asset
}

internal extension URL {
  var isPHAssetUrl: Bool {
    return self.absoluteString.hasPrefix("ph://")
  }
}

private struct AVAssetRequestResult {
  var asset: AVAsset?
  var audioMix: AVAudioMix?
  var info: [AnyHashable: Any]?
}

private extension PHImageManager {
  func requestAvAsset(forVideo asset: PHAsset, options: PHVideoRequestOptions?) async -> AVAssetRequestResult {
    return await withCheckedContinuation { continuation in
      self.requestAVAsset(forVideo: asset, options: options) { asset, audioMix, info in
        continuation.resume(returning: AVAssetRequestResult(asset: asset, audioMix: audioMix, info: info))
      }
    }
  }
}
