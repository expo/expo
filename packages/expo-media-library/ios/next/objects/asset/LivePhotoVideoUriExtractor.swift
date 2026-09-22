import Foundation
import Photos

class LivePhotoVideoUriExtractor {
  static func extract(from asset: PHAsset) async throws -> URL? {
    guard
      isLivePhoto(asset),
      let livePhoto = try await requestLivePhoto(for: asset),
      let resource = pairedVideoResource(from: livePhoto)
    else {
      return nil
    }

    return try await writeResourceToTemporaryFile(resource)
  }

  private static func isLivePhoto(_ asset: PHAsset) -> Bool {
    asset.mediaType == .image && asset.mediaSubtypes.contains(.photoLive)
  }

  private static func requestLivePhoto(for asset: PHAsset) async throws -> PHLivePhoto? {
    let options = PHLivePhotoRequestOptions()
    options.isNetworkAccessAllowed = true
    return try await PHImageManager.default().requestLivePhoto(for: asset, options: options)
  }

  private static func pairedVideoResource(from livePhoto: PHLivePhoto) -> PHAssetResource? {
    PHAssetResource.assetResources(for: livePhoto).first { $0.type == .pairedVideo }
  }

  private static func writeResourceToTemporaryFile(_ resource: PHAssetResource) async throws -> URL {
    let fileExtension = URL(fileURLWithPath: resource.originalFilename).pathExtension
    let temporaryURL = FileManager.default.temporaryDirectory
      .appendingPathComponent(UUID().uuidString)
      .appendingPathExtension(fileExtension)
    try await PHAssetResourceManager.default().writeData(for: resource, toFile: temporaryURL)
    return temporaryURL
  }
}
