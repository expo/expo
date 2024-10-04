import Photos
import Dispatch
import SDWebImage
import ExpoModulesCore

/**
 A custom loader for assets from the Photo Library. It handles all urls with the `ph` scheme.
 */
final class PhotoLibraryAssetLoader: NSObject, SDImageLoader {
  // MARK: - SDImageLoader

  func canRequestImage(for url: URL?) -> Bool {
    return isPhotoLibraryAssetUrl(url)
  }

  func requestImage(
    with url: URL?,
    options: SDWebImageOptions = [],
    context: SDWebImageContext?,
    progress progressBlock: SDImageLoaderProgressBlock?,
    completed completedBlock: SDImageLoaderCompletedBlock? = nil
  ) -> SDWebImageOperation? {
    guard isPhotoLibraryStatusAuthorized() else {
      let error = makeNSError(description: "Unauthorized access to the Photo Library")
      completedBlock?(nil, nil, error, false)
      return nil
    }
    let operation = PhotoLibraryAssetLoaderOperation()

    DispatchQueue.global(qos: .userInitiated).async {
      guard let url = url, let assetLocalIdentifier = assetLocalIdentifier(fromUrl: url) else {
        let error = makeNSError(description: "Unable to obtain the asset identifier from the url: '\(String(describing: url?.absoluteString))'")
        completedBlock?(nil, nil, error, false)
        return
      }
      guard let asset = PHAsset.fetchAssets(withLocalIdentifiers: [assetLocalIdentifier], options: .none).firstObject else {
        let error = makeNSError(description: "Asset with identifier '\(assetLocalIdentifier)' not found in the Photo Library")
        completedBlock?(nil, nil, error, false)
        return
      }
      operation.requestId = requestAsset(
        asset,
        url: url,
        context: context,
        progressBlock: progressBlock,
        completedBlock: completedBlock
      )
    }
    return operation
  }

  func shouldBlockFailedURL(with url: URL, error: Error) -> Bool {
    // The lack of permission is one of the reasons of failed request,
    // but in that single case we don't want to blacklist the url as
    // the permission might be granted later and then the retry should be possible.
    return isPhotoLibraryStatusAuthorized()
  }
}

/**
 Returns a bool value whether the given url references the Photo Library asset.
 */
internal func isPhotoLibraryAssetUrl(_ url: URL?) -> Bool {
  return url?.scheme == "ph"
}

/**
 Returns the local identifier of the asset from the given `ph://` url.
 These urls have the form of "ph://26687849-33F9-4402-8EC0-A622CD011D70",
 where the asset local identifier is used as the host part.
 */
private func assetLocalIdentifier(fromUrl url: URL) -> String? {
  return url.host
}

/**
 Checks whether the app is authorized to read the Photo Library.
 */
private func isPhotoLibraryStatusAuthorized() -> Bool {
  let status = PHPhotoLibrary.authorizationStatus(for: .readWrite)
  return status == .authorized || status == .limited
}

/**
 Requests the image of the given asset object and returns the request identifier.
 */
private func requestAsset(
  _ asset: PHAsset,
  url: URL,
  context: SDWebImageContext?,
  progressBlock: SDImageLoaderProgressBlock?,
  completedBlock: SDImageLoaderCompletedBlock?
) -> PHImageRequestID {
  let options = PHImageRequestOptions()
  options.isSynchronous = false
  options.version = .current
  options.deliveryMode = .highQualityFormat
  options.resizeMode = .fast
  options.normalizedCropRect = .zero
  options.isNetworkAccessAllowed = true

  if let progressBlock = progressBlock {
    options.progressHandler = { progress, _, _, _ in
      // The `progress` is a double from 0.0 to 1.0, but the loader needs integers so we map it to 0...100 range
      let progressPercentage = Int((progress * 100.0).rounded())
      progressBlock(progressPercentage, 100, url)
    }
  }

  let screenScale = context?[ImageView.screenScaleKey] as? Double ?? UIScreen.main.scale
  let targetSize = CGSize(width: Double(asset.pixelWidth) / screenScale, height: Double(asset.pixelHeight) / screenScale)

  return PHImageManager.default().requestImage(
    for: asset,
    targetSize: targetSize,
    contentMode: .aspectFit,
    options: options,
    resultHandler: { image, info in
      // This value can be `true` only when network access is allowed and the photo is stored in the iCloud.
      let isDegraded: Bool = info?[PHImageResultIsDegradedKey] as? Bool ?? false

      completedBlock?(image, nil, nil, !isDegraded)
    }
  )
}

/**
 Loader operation specialized for the Photo Library by keeping the request identifier.
 */
private class PhotoLibraryAssetLoaderOperation: NSObject, SDWebImageOperation {
  var canceled: Bool = false
  var requestId: PHImageRequestID?

  // MARK: - SDWebImageOperation

  func cancel() {
    if let requestId = requestId {
      PHImageManager.default().cancelImageRequest(requestId)
    }
    canceled = true
  }
}
