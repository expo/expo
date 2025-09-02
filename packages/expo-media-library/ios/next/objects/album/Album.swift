import ExpoModulesCore
import Photos
import UniformTypeIdentifiers

class Album: SharedObject {
  let id: String
  private(set) var collection: PHAssetCollection?

  init(id: String) {
    self.id = id
  }

  func getCollection() async throws -> PHAssetCollection {
    return try await requirePHAssetCollection()
  }

  // TODO: Caching assets
  func getAssets() async throws -> [Asset] {
    let collection = try await requirePHAssetCollection()
    let phAssets = AssetRepository.shared.get(by: collection)
    return phAssets.map { Asset(id: $0.localIdentifier) }
  }

  func title() async throws -> String {
    let collection = try await requirePHAssetCollection()
    guard let title = collection.localizedTitle else {
      throw FailedToGetPropertyException("Album title not found")
    }
    return title
  }

  func add(_ asset: Asset) async throws {
    let collection = try await requirePHAssetCollection()
    guard let phAsset = AssetRepository.shared.get(by: [asset.id]).first else {
      throw AssetCouldNotBeAddedToAlbumException("phAsset not found")
    }
    try await AssetCollectionRepository.shared.add(assets: [phAsset], to: collection)
  }

  func delete(deleteAssets: Bool = false) async throws {
    let collection = try await requirePHAssetCollection()
    try await AssetCollectionRepository.shared.delete(by: [collection], deleteAssets: deleteAssets)
  }

  private func requirePHAssetCollection() async throws -> PHAssetCollection {
    try await loadPHAssetCollection()
    guard let collection else {
      throw AlbumNotFoundException(id)
    }
    return collection
  }

  private func loadPHAssetCollection() async throws {
    if collection != nil {
      return
    }

    let options = PHFetchOptions()
    options.includeHiddenAssets = true
    options.fetchLimit = 1

    let fetchResult = PHAssetCollection.fetchAssetCollections(
      withLocalIdentifiers: [id],
      options: options
    )
    guard let fetchedAlbum = fetchResult.firstObject else {
      throw AlbumNotFoundException(id)
    }

    collection = fetchedAlbum
  }
}
