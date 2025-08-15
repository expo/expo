import ExpoModulesCore
import Photos
import UniformTypeIdentifiers

class Album: SharedObject {
  let id: String
  var collection: PHAssetCollection?
  private let context: AppContext

  init(id: String, context: AppContext) {
    self.id = id
    self.context = context
  }

  func getCollection() async throws -> PHAssetCollection {
    try await fetchAlbumIfNeeded()
    guard let collection = collection else {
      throw Exception()
    }
    return collection
  }

  // TODO: Caching assets
  func getAssets() async throws -> [Asset] {
    try await fetchAlbumIfNeeded()
    guard let collection = collection else {
      throw Exception()
    }
    let phAssets = AssetRepository.shared.get(by: collection)
    return phAssets.map { Asset(id: $0.localIdentifier, context: context) }
  }

  func name() async throws -> String {
    try await fetchAlbumIfNeeded()
    guard let title = collection?.localizedTitle else {
      throw FailedToGetPropertyException("Album title not found")
    }
    return title
  }

  func delete(deleteAssets: Bool = false) async throws {
    try await fetchAlbumIfNeeded()
    guard let collection = collection else {
      throw Exception()
    }
    try await CollectionRepository.shared.delete(by: [collection], deleteAssets: deleteAssets)
  }

  private func fetchAlbumIfNeeded() async throws {
    if collection != nil {
      return
    }

    let options = PHFetchOptions()
    options.includeHiddenAssets = true
    options.fetchLimit = 1

    let fetchResult = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [id], options: options)
    guard let fetchedAlbum = fetchResult.firstObject else {
      throw Exception()
    }

    collection = fetchedAlbum
  }
}
