import Foundation
import Photos

class AssetMapper {
  func toDto(_ phAsset: PHAsset) async throws -> AssetInfo {
    return AssetInfo(
      id: "ph://\(phAsset.localIdentifier)",
      creationTime: mapCreationTime(phAsset.creationDate),
      duration: mapDuration(phAsset.duration),
      uri: try await mapUri(phAsset),
      filename: try mapFilename(phAsset),
      height: phAsset.pixelHeight,
      width: phAsset.pixelWidth,
      mediaType: mapMediaType(phAsset.mediaType),
      modificationTime: mapModificationTime(phAsset.modificationDate),
      isFavorite: phAsset.isFavorite
    )
  }

  func toMetadata(_ phAsset: PHAsset) throws -> AssetMetadata {
    return AssetMetadata(
      id: "ph://\(phAsset.localIdentifier)",
      creationTime: mapCreationTime(phAsset.creationDate),
      duration: mapDuration(phAsset.duration),
      filename: try mapFilename(phAsset),
      height: phAsset.pixelHeight,
      width: phAsset.pixelWidth,
      mediaType: mapMediaType(phAsset.mediaType),
      modificationTime: mapModificationTime(phAsset.modificationDate),
      isFavorite: phAsset.isFavorite
    )
  }

  func mapCreationTime(_ date: Date?) -> Int? {
    return date?.millisecondsSince1970
  }

  func mapDuration(_ duration: TimeInterval) -> Int? {
    return duration > 0 ? Int(duration * 1000) : nil
  }

  func mapUri(_ phAsset: PHAsset) async throws -> String {
    return try await UriExtractor.extract(from: phAsset).absoluteString
  }

  func mapFilename(_ phAsset: PHAsset) throws -> String {
    guard let filename = phAsset.value(forKey: "filename") as? String else {
      throw FailedToGetPropertyException("filename")
    }
    return filename
  }

  func mapMediaType(_ mediaType: PHAssetMediaType) -> MediaTypeNext {
    return MediaTypeNext.from(mediaType)
  }

  func mapModificationTime(_ date: Date?) -> Int? {
    return date?.millisecondsSince1970
  }
}
