import Foundation
import Photos
import UniformTypeIdentifiers
import ExpoModulesCore

class Asset: SharedObject {
  let id: String
  let localIdentifier: String
  var phAsset: PHAsset?

  init(id: String) {
    self.id = id
    self.localIdentifier = String(id.dropFirst("ph://".count))
  }

  init(localIdentifier: String) {
    self.id = "ph://\(localIdentifier)"
    self.localIdentifier = localIdentifier
  }

  func getHeight() async throws -> Int {
    let phAsset = try await requirePHAsset()
    return phAsset.pixelHeight
  }

  func getWidth() async throws -> Int {
    let phAsset = try await requirePHAsset()
    return phAsset.pixelWidth
  }

  func getShape() async throws -> Shape? {
    let phAsset = try await requirePHAsset()
    guard phAsset.pixelWidth > 0 && phAsset.pixelHeight > 0 else {
      return nil
    }
    return Shape(width: phAsset.pixelWidth, height: phAsset.pixelHeight)
  }

  func getDuration() async throws -> Int? {
    let phAsset = try await requirePHAsset()
    return phAsset.duration > 0 ? Int(phAsset.duration * 1000) : nil
  }

  func getFilename() async throws -> String {
    let phAsset = try await requirePHAsset()
    guard let filename = phAsset.value(forKey: "filename") as? String else {
      throw FailedToGetPropertyException("filename")
    }
    return filename
  }

  func getCreationTime() async throws -> Int? {
    let phAsset = try await requirePHAsset()
    guard let date = phAsset.creationDate else {
      return nil
    }
    return date.millisecondsSince1970
  }

  func getLocation() async throws -> Location? {
    let phAsset = try await requirePHAsset()
    guard let clLocation = phAsset.location else {
      return nil
    }
    return Location(
      latitude: clLocation.coordinate.latitude,
      longitude: clLocation.coordinate.longitude
    )
  }

  func getModificationTime() async throws -> Int? {
    let phAsset = try await requirePHAsset()
    guard let date = phAsset.modificationDate else {
      return nil
    }
    return date.millisecondsSince1970
  }

  func getFavorite() async throws -> Bool {
    let phAsset = try await requirePHAsset()
    return phAsset.isFavorite
  }

  func getMediaType() async throws -> MediaTypeNext {
    let phAsset = try await requirePHAsset()
    return MediaTypeNext.from(phAsset.mediaType)
  }

  func getMediaSubtypes() async throws -> [String] {
    let phAsset = try await requirePHAsset()
    return MediaSubtype.stringify(phAsset.mediaSubtypes)
  }

  func getLivePhotoVideoUri() async throws -> String? {
    let phAsset = try await requirePHAsset()
    return try await LivePhotoVideoUriExtractor.extract(from: phAsset)?.absoluteString
  }

  func getIsInCloud() async throws -> Bool {
    let phAsset = try await requirePHAsset()
    switch phAsset.mediaType {
    case .image:
      let options = PHContentEditingInputRequestOptions()
      options.isNetworkAccessAllowed = false
      let result = try await phAsset.requestContentEditingInput(options: options)
      return result.info?[PHContentEditingInputResultIsInCloudKey] as? Bool ?? false
    case .video:
      let options = PHVideoRequestOptions()
      options.isNetworkAccessAllowed = false
      let result = try await PHImageManager.default().requestAVAsset(forVideo: phAsset, options: options)
      return result.info?[PHImageResultIsInCloudKey] as? Bool ?? false
    default:
      return false
    }
  }

  func getOrientation() async throws -> Int? {
    let phAsset = try await requirePHAsset()
    guard
      phAsset.mediaType == .image,
      let contentEditingInput = try await phAsset.requestContentEditingInput().input
    else {
      return nil
    }
    let orientation = contentEditingInput.fullSizeImageOrientation
    return orientation != 0 ? Int(orientation) : nil
  }

  func getExif() async throws -> [String: Any?] {
    let phAsset = try await requirePHAsset()
    guard try await getMediaType() == MediaTypeNext.IMAGE else {
      return [:]
    }
    let uri = try await UriExtractor.extract(from: phAsset)
    guard let ciImage = CIImage(contentsOf: uri) else {
      return [:]
    }
    return ciImage.properties
  }

  func getUri() async throws -> String {
    let phAsset = try await requirePHAsset()
    return try await UriExtractor.extract(from: phAsset).absoluteString
  }

  func getInfo() async throws -> AssetInfo {
    return await AssetInfo(
      id: id,
      creationTime: try getCreationTime(),
      duration: try getDuration(),
      uri: try getUri(),
      filename: try getFilename(),
      height: try getHeight(),
      width: try getWidth(),
      mediaType: try getMediaType(),
      modificationTime: try getModificationTime(),
      isFavorite: try getFavorite()
    )
  }

  func getAlbums() async throws -> [Album] {
    let phAsset = try await requirePHAsset()
    let collections = AssetCollectionRepository.shared.get(containing: phAsset)
    return collections.map { Album(id: $0.localIdentifier) }
  }

  func delete() async throws {
    let assetToDelete = try await requirePHAsset()
    try await AssetRepository.shared.delete(by: [assetToDelete])
  }

  func setFavorite(_ isFavorite: Bool) async throws {
    let phAsset = try await requirePHAsset()
    try await PHPhotoLibrary.shared().performChanges {
      let request = PHAssetChangeRequest(for: phAsset)
      request.isFavorite = isFavorite
    }
    invalidateCache()
  }

  private func requirePHAsset() async throws -> PHAsset {
    try await loadPHAsset()
    guard let phAsset else {
      throw AssetNotFoundException(id)
    }
    return phAsset
  }

  private func loadPHAsset() async throws {
    if phAsset != nil {
      return
    }

    let options = PHFetchOptions()
    options.includeHiddenAssets = true
    options.includeAllBurstAssets = true
    options.fetchLimit = 1

    guard let fetchedAsset = PHAsset.fetchAssets(
      withLocalIdentifiers: [localIdentifier],
      options: options
    ).firstObject else {
      throw AssetNotFoundException(id)
    }
    self.phAsset = fetchedAsset
  }

  private func invalidateCache() {
    // phAsset is an immutable cache, therefore it must be cleared after each performChanges
    self.phAsset = nil
  }

  static func from(filePath: URL) async throws -> Asset {
    guard FileManager.default.fileExists(atPath: filePath.path) else {
      throw FailedToCreateAssetException("File does not exist at path: \(filePath.path)")
    }
    let localIdentifier = try await AssetRepository.shared.add(from: filePath)
    return Asset(localIdentifier: localIdentifier)
  }
}
