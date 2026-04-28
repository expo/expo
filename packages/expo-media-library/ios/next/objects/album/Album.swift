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
    return phAssets.map { Asset(localIdentifier: $0.localIdentifier) }
  }

  func title() async throws -> String {
    let collection = try await requirePHAssetCollection()
    guard let title = collection.localizedTitle else {
      throw FailedToGetPropertyException("Album title not found")
    }
    return title
  }

  func add(_ assets: [Asset]) async throws {
    let collection = try await requirePHAssetCollection()
    let phAssets = try resolvePHAssets(from: assets)
    try await AssetCollectionRepository.shared.add(assets: phAssets, to: collection)
  }

  func delete(deleteAssets: Bool = false) async throws {
    let collection = try await requirePHAssetCollection()
    try await AssetCollectionRepository.shared.delete(by: [collection], deleteAssets: deleteAssets)
  }

  func removeAssets(_ assets: [Asset]) async throws {
    let collection = try await requirePHAssetCollection()
    let phAssets = AssetRepository.shared.get(by: assets.map { $0.localIdentifier })
    try await AssetCollectionRepository.shared.remove(assets: phAssets, from: collection)
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

  private func resolvePHAssets(from assets: [Asset]) throws -> [PHAsset] {
    let localIdentifiers = assets.map(\.localIdentifier)
    let fetchedAssets = AssetRepository.shared.get(by: localIdentifiers)
    let assetsByIdentifier = Dictionary(
      uniqueKeysWithValues: fetchedAssets.map { ($0.localIdentifier, $0) }
    )

    return try localIdentifiers.map { localIdentifier in
      guard let phAsset = assetsByIdentifier[localIdentifier] else {
        throw AssetCouldNotBeAddedToAlbumException("phAsset not found")
      }
      return phAsset
    }
  }

  static func getAll() async throws -> [Album] {
    AssetCollectionRepository.shared.getAll()
      .map { Album(id: $0.localIdentifier) }
  }
}
