import Photos

final class AssetRepository {
  static let shared = AssetRepository()
  private init() {}

  func delete(by ids: [String]) async throws {
    let assets = get(by: ids)
    try await delete(by: assets)
  }

  func delete(by assets: [PHAsset]) async throws {
    try await PHPhotoLibrary.shared().performChanges {
      PHAssetChangeRequest.deleteAssets(assets as NSFastEnumeration)
    }
  }

  func get(by ids: [String]) -> [PHAsset] {
    var assets: [PHAsset] = []
    let fetchedAssets = PHAsset.fetchAssets(withLocalIdentifiers: ids, options: nil)
    fetchedAssets.enumerateObjects { asset, _, _ in
      assets.append(asset)
    }
    return assets
  }

  func get(by collection: PHAssetCollection) -> [PHAsset] {
    var assets: [PHAsset] = []
    let fetchedAssets = PHAsset.fetchAssets(in: collection, options: nil)
    fetchedAssets.enumerateObjects { asset, _, _ in
      assets.append(asset)
    }
    return assets
  }

  func get(by collections: [PHAssetCollection]) -> [PHAsset] {
    var assets: [PHAsset] = []
    for collection in collections {
      assets.append(contentsOf: get(by: collection))
    }
    return assets
  }

  func get(with options: PHFetchOptions) -> [PHAsset] {
    var assets: [PHAsset] = []
    let fetchedAssets = PHAsset.fetchAssets(with: options)
    fetchedAssets.enumerateObjects { asset, _, _ in
      assets.append(asset)
    }
    return assets
  }

  func get(by collection: PHAssetCollection, with options: PHFetchOptions) -> [PHAsset] {
    var assets: [PHAsset] = []
    let fetchedAssets = PHAsset.fetchAssets(in: collection, options: options)
    fetchedAssets.enumerateObjects { asset, _, _ in
      assets.append(asset)
    }
    return assets
  }

  func add(from filePaths: [URL]) async throws -> [String] {
    var assetIds: [String] = []
    try await PHPhotoLibrary.shared().performChanges {
      assetIds = try filePaths.map { filePath in
        let creationRequest = try self.makeCreationRequest(for: filePath)
        return try self.extractIdentifier(from: creationRequest)
      }
    }
    return assetIds
  }

  func add(from filePath: URL) async throws -> String {
    guard let firstId = try await add(from: [filePath]).first else {
      throw FailedToCreateAssetException("Failed to create asset from file \(filePath.lastPathComponent)")
    }
    return firstId
  }

  private func makeCreationRequest(for filePath: URL) throws -> PHAssetChangeRequest {
    let mediaType = detectMediaType(for: filePath)
    try ensureMediaTypeIsSupported(mediaType, filePath: filePath)
    return try createAssetChangeRequest(for: filePath, mediaType: mediaType)
  }

  private func detectMediaType(for filePath: URL) -> PHAssetMediaType {
    assetType(for: filePath)
  }

  private func ensureMediaTypeIsSupported(_ type: PHAssetMediaType, filePath: URL) throws {
    guard !filePath.pathExtension.isEmpty else {
      throw FailedToCreateAssetException("File '\(filePath.lastPathComponent)' has no extension")
    }

    guard type != .unknown else {
      throw FailedToCreateAssetException("File '\(filePath.lastPathComponent)' has an unknown media type")
    }

    guard type != .audio else {
      throw FailedToCreateAssetException("Audio files are not supported: \(filePath.lastPathComponent)")
    }
  }

  private func createAssetChangeRequest(for filePath: URL, mediaType: PHAssetMediaType) throws -> PHAssetChangeRequest {
    switch mediaType {
    case .video:
      guard let request = PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: filePath) else {
        throw FailedToCreateAssetException("Unable to create video asset request for \(filePath.lastPathComponent)")
      }
      return request

    case .image:
      guard let request = PHAssetChangeRequest.creationRequestForAssetFromImage(atFileURL: filePath) else {
        throw FailedToCreateAssetException("Unable to create image asset request for \(filePath.lastPathComponent)")
      }
      return request

    default:
      throw FailedToCreateAssetException("Unsupported asset type for file: \(filePath.lastPathComponent)")
    }
  }

  private func extractIdentifier(from request: PHAssetChangeRequest) throws -> String {
    guard let placeholder = request.placeholderForCreatedAsset else {
      throw FailedToCreateAssetException("Asset creation request does not contain a placeholder")
    }
    return placeholder.localIdentifier
  }
}
