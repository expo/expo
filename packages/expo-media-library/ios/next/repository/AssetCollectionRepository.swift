import Photos

final class AssetCollectionRepository {
  static let shared = AssetCollectionRepository()
  private init() {}

  func getAll() -> [PHAssetCollection] {
    var collections: [PHAssetCollection] = []
    let pHFetchResult = PHCollectionList.fetchTopLevelUserCollections(with: nil)

    pHFetchResult.enumerateObjects { collection, _, _ in
      if let assetCollection = collection as? PHAssetCollection {
        collections.append(assetCollection)
      }
    }
    return collections
  }

  func get(by ids: [String]) -> [PHAssetCollection] {
    var collections: [PHAssetCollection] = []
    let pHFetchResult = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: ids, options: nil)
    pHFetchResult.enumerateObjects { collection, _, _ in
      collections.append(collection)
    }
    return collections
  }

  func get(by id: String) -> PHAssetCollection? {
    let pHFetchResult = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [id], options: nil)
    var fetchedCollection: PHAssetCollection?
    pHFetchResult.enumerateObjects { collection, _, _ in
      fetchedCollection = collection
    }
    return fetchedCollection
  }

  func delete(by collectionIds: [String], deleteAssets: Bool = false) async throws {
    let albums = get(by: collectionIds)
    try await delete(by: albums, deleteAssets: deleteAssets)
  }

  func delete(by collections: [PHAssetCollection], deleteAssets: Bool = false) async throws {
    try await PHPhotoLibrary.shared().performChanges {
      if deleteAssets {
        let allAssets = AssetRepository.shared.get(by: collections)
        PHAssetChangeRequest.deleteAssets(allAssets as NSFastEnumeration)
      }
      PHAssetCollectionChangeRequest.deleteAssetCollections(collections as NSFastEnumeration)
    }
  }

  func add(name: String) async throws -> String {
    var collectionPlaceholder: PHObjectPlaceholder?

    try await PHPhotoLibrary.shared().performChanges {
      let createCollectionRequest = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: name)
      collectionPlaceholder = createCollectionRequest.placeholderForCreatedAssetCollection
    }

    guard let placeholder = collectionPlaceholder else {
      throw FailedToCreateAlbumException("Failed to create album")
    }
    return placeholder.localIdentifier
  }

  func add(assets: [PHAsset], to collectionId: String) async throws {
    guard let collection = get(by: collectionId) else {
      throw FailedToGetAlbumException("Collection not found")
    }
    try await add(assets: assets, to: collection)
  }

  func add(assets: [PHAsset], to collection: PHAssetCollection) async throws {
    try await PHPhotoLibrary.shared().performChanges {
      if let changeRequest = PHAssetCollectionChangeRequest(for: collection) {
        changeRequest.addAssets(assets as NSFastEnumeration)
      }
    }
  }
}
