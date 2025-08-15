import Foundation
import Photos
import UniformTypeIdentifiers
import ExpoModulesCore

class Asset: SharedObject {
  let id: String
  let context: AppContext
  var phAsset: PHAsset?

  init(id: String, context: AppContext) {
    self.id = id
    self.context = context
  }

  func getHeight() async throws -> Int? {
    try await property(phAsset?.pixelHeight)
  }

  func getWidth() async throws -> Int? {
    try await property(phAsset?.pixelWidth)
  }

  func getSize() async throws -> (Int?, Int?) {
    try await (getHeight(), getWidth())
  }

  func getCreationTime() async throws -> Int {
    let time = try await property(phAsset?.creationDate)
    return Int(time.timeIntervalSince1970)
  }

  func getModificationTime() async throws -> Int {
    let time = try await property(phAsset?.modificationDate)
    return Int(time.timeIntervalSince1970)
  }

  func getMimeType() async throws -> Int? {
    try await property(phAsset?.mediaType.rawValue)
  }

  func getLocalUri() async throws -> URL? {
    return nil
  }

  func delete() async throws {
    try await fetchAssetIfNeeded()
    guard let assetToDelete = phAsset else {
      throw FailedToDeleteAssetException("PHAsset is nil")
    }
    try await AssetRepository.shared.delete(by: [assetToDelete])
  }

  private func fetchAssetIfNeeded() async throws {
    if phAsset != nil {
      return
    }

    let options = PHFetchOptions()
    options.includeHiddenAssets = true
    options.includeAllBurstAssets = true
    options.fetchLimit = 1

    guard let fetchedAsset = PHAsset.fetchAssets(withLocalIdentifiers: [self.id], options: options).firstObject else {
      throw Exception()
    }
    self.phAsset = fetchedAsset
  }

  static func from(filePath: URL, context: AppContext) async throws -> Asset {
    guard FileManager.default.fileExists(atPath: filePath.path) else {
      throw FailedToCreateAssetException("File does not exist at path: \(filePath.path)")
    }
    let id = try await AssetRepository.shared.add(from: filePath)
    return Asset(id: id, context: context)
  }

  static func assetType(for localUri: URL) -> PHAssetMediaType {
    guard let type = UTType(filenameExtension: localUri.pathExtension) else {
      return .unknown
    }

    if type.conforms(to: .image) {
      return .image
    }
    if type.conforms(to: .movie) || type.conforms(to: .video) {
      return .video
    }
    if type.conforms(to: .audio) {
      return .audio
    }

    return .unknown
  }

  private func property<T>(_ value: T?, function: String = #function) async throws -> T {
    try await fetchAssetIfNeeded()
    guard let property = value else {
      throw FailedToGetPropertyException(function)
    }
    return property
  }
}
