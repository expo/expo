import ExpoModulesCore
import Photos

public final class MediaLibraryNextModule: Module {
  private var writeOnly = false

  public func definition() -> ModuleDefinition {
    Name("ExpoMediaLibraryNext")

    // swiftlint:disable:next closure_body_length
    Class(Asset.self) {
      Constructor { (id: String) -> Asset in
        guard let context = appContext else {
          throw Exceptions.AppContextLost()
        }
        return Asset(id: id, context: context)
      }

      Property("id") { (this: Asset) in
        this.id
      }

      AsyncFunction("getCreationTime") { (this: Asset) in
        try await this.getCreationTime()
      }

      AsyncFunction("getDuration") { (this: Asset) in
        try await this.getDuration()
      }

      AsyncFunction("getFilename") { (this: Asset) in
        try await this.getFilename()
      }

      AsyncFunction("getHeight") { (this: Asset) in
        try await this.getHeight()
      }

      AsyncFunction("getMediaType") { (this: Asset) in
        try await this.getMediaType()
      }

      AsyncFunction("getModificationTime") { (this: Asset) in
        try await this.getModificationTime()
      }

      AsyncFunction("getUri") { (this: Asset) in
        try await this.getUri()
      }

      AsyncFunction("getWidth") { (this: Asset) in
        try await this.getWidth()
      }

      AsyncFunction("delete") { (this: Asset) in
        try await this.delete()
      }
    }

    Class(Album.self) {
      Constructor { (id: String) -> Album in
        guard let context = appContext else {
          throw Exceptions.AppContextLost()
        }
        return Album(id: id, context: context)
      }

      Property("id") { (album: Album) in
        album.id
      }

      AsyncFunction("getTitle") { (album: Album) async throws in
        try await album.title()
      }

      AsyncFunction("getAssets") { (album: Album) async throws in
        try await album.getAssets()
      }

      AsyncFunction("add") { (album: Album, asset: Asset) async throws in
        try await album.add(asset)
      }

      AsyncFunction("delete") { (album: Album) async throws in
        try await album.delete()
      }
    }

    AsyncFunction("deleteManyAlbums") { (albums: [Album], deleteAssets: Bool) async throws in
      try await checkIfPermissionGranted()
      let albumsIds = albums.map { $0.id }
      try await CollectionRepository.shared.delete(by: albumsIds, deleteAssets: deleteAssets)
    }

    AsyncFunction("deleteManyAssets") { (assets: [Asset]) async throws in
      try await checkIfPermissionGranted()
      let assetIds = assets.map { $0.id }
      try await AssetRepository.shared.delete(by: assetIds)
    }

    AsyncFunction("getAllAlbums") {
      try await checkIfPermissionGranted()
      guard let context = appContext else {
        throw Exceptions.AppContextLost()
      }
      let collections = CollectionRepository.shared.getAll()
      return collections.map { Album(id: $0.localIdentifier, context: context) }
    }

    AsyncFunction("createAsset") { (filePath: URL, album: Album?) async throws in
      try await checkIfPermissionGranted()
      guard let context = appContext else {
        throw Exceptions.AppContextLost()
      }
      let newAssetId = try await AssetRepository.shared.add(from: filePath)
      if let guardedAlbum = album {
        guard let asset = AssetRepository.shared.get(by: [newAssetId]).first else {
          throw FailedToCreateAlbumException("Failed to fetch newly created asset")
        }
        try await CollectionRepository.shared.add(assets: [asset], to: guardedAlbum.id)
      }
      return Asset(id: newAssetId, context: context)
    }

    AsyncFunction("createAlbum") { (name: String, assetRefs: Either<[Asset], [URL]>) async throws -> Album in
      try await checkIfPermissionGranted()
      guard let context = appContext else {
        throw Exceptions.AppContextLost()
      }
      let assetIds = try await getAssetIdsFromAssetRefs(from: assetRefs)
      let newCollectionId = try await CollectionRepository.shared.add(name: name)
      let phAssetsToAdd = AssetRepository.shared.get(by: assetIds)
      try await CollectionRepository.shared.add(assets: phAssetsToAdd, to: newCollectionId)
      return Album(id: newCollectionId, context: context)
    }

    AsyncFunction("getPermissionsAsync") { (writeOnly: Bool, promise: Promise) in
      self.writeOnly = writeOnly
      appContext?
        .permissions?
        .getPermissionUsingRequesterClass(
          requesterClass(writeOnly),
          resolve: promise.resolver,
          reject: promise.legacyRejecter
        )
    }

    AsyncFunction("requestPermissionsAsync") { (writeOnly: Bool, promise: Promise) in
      self.writeOnly = writeOnly
      appContext?
        .permissions?
        .askForPermission(
          usingRequesterClass: requesterClass(writeOnly),
          resolve: promise.resolver,
          reject: promise.legacyRejecter
        )
    }
  }

  private func getAssetIdsFromAssetRefs(from assetRefs: Either<[Asset], [URL]>) async throws -> [String] {
    var ids: [String] = []
    if assetRefs.is([Asset].self) {
      let assets = try assetRefs.as([Asset].self)
      ids = assets.map { $0.id }
    } else if assetRefs.is([URL].self) {
      let filePaths = try assetRefs.as([URL].self)
      ids = try await AssetRepository.shared.add(from: filePaths)
    } else {
      throw FailedToCreateAlbumException("Unsupported assetRefs type")
    }
    return ids
  }

  private func checkIfPermissionGranted() async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      appContext?.permissions?.getPermissionUsingRequesterClass(
        MediaLibraryPermissionRequester.self,
        resolve: { result in
          if let permissions = result as? [String: Any] {
            if permissions["status"] as? String != "granted" ||
              permissions["accessPrivileges"] as? String != "all" {
              continuation.resume(throwing: FailedToGrantPermissions(""))
              return
            }
            continuation.resume(returning: ())
          } else {
            continuation.resume(throwing: FailedToGrantPermissions(""))
          }
        },
        reject: { _, _, error in
          if let error = error {
            continuation.resume(throwing: error)
          } else {
            continuation.resume(throwing: FailedToGrantPermissions(""))
          }
        }
      )
    }
  }
}
