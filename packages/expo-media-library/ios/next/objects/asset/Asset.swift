import Foundation
import Photos
import UniformTypeIdentifiers
import ExpoModulesCore

class Asset: SharedObject {
  let id: String
  var phAsset: PHAsset?

  init(id: String) {
    self.id = id
  }

  func getHeight() async throws -> Int {
    let phAsset = try await requirePHAsset()
    return phAsset.pixelHeight
  }

  func getWidth() async throws -> Int {
    let phAsset = try await requirePHAsset()
    return phAsset.pixelWidth
  }

  func getDuration() async throws -> Double? {
    let phAsset = try await requirePHAsset()
    return phAsset.duration != 0 ? phAsset.duration : nil
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
    return Int(date.timeIntervalSince1970)
  }

  func getModificationTime() async throws -> Int? {
    let phAsset = try await requirePHAsset()
    guard let date = phAsset.modificationDate else {
      return nil
    }
    return Int(date.timeIntervalSince1970)
  }

  func getMediaType() async throws -> MediaTypeNext {
    let phAsset = try await requirePHAsset()
    return MediaTypeNext.from(phAsset.mediaType)
  }

  func getUri() async throws -> String {
    let phAsset = try await requirePHAsset()

    switch phAsset.mediaType {
      case PHAssetMediaType.image:
        let contentEditingInput = try await phAsset.requestContentEditingInput()
        guard let url = contentEditingInput.fullSizeImageURL else {
          throw FailedToGetPropertyException("uri")
        }
        return url.absoluteString

      case PHAssetMediaType.video:
        let options = PHVideoRequestOptions()
        options.version = .original
        guard let avAsset = try await PHImageManager.default()
          .requestAVAsset(forVideo: phAsset, options: options) as? AVURLAsset else {
          throw FailedToGetPropertyException("uri")
        }
        return avAsset.url.absoluteString

      default:
        throw FailedToGetPropertyException("uri")
      }
  }

  func delete() async throws {
    let assetToDelete = try await requirePHAsset()
    try await AssetRepository.shared.delete(by: [assetToDelete])
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
      withLocalIdentifiers: [self.id],
      options: options
    ).firstObject else {
      throw AssetNotFoundException(id)
    }
    self.phAsset = fetchedAsset
  }

  static func from(filePath: URL) async throws -> Asset {
    guard FileManager.default.fileExists(atPath: filePath.path) else {
      throw FailedToCreateAssetException("File does not exist at path: \(filePath.path)")
    }
    let id = try await AssetRepository.shared.add(from: filePath)
    return Asset(id: id)
  }
}
