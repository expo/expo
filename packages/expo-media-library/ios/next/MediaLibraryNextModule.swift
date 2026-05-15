import ExpoModulesCore
import Photos
import PhotosUI

public final class MediaLibraryNextModule: Module {
  private static let libraryDidChangeEvent = "mediaLibraryDidChange"
  private lazy var observerManager = PhotoLibraryObserverManager(onChange: { [weak self] body in
    guard let self = self else {
      return
    }
    self.sendEvent(MediaLibraryNextModule.libraryDidChangeEvent, body)
  })

  public func definition() -> ModuleDefinition {
    Name("ExpoMediaLibraryNext")

    Events(MediaLibraryNextModule.libraryDidChangeEvent)

    OnStartObserving(MediaLibraryNextModule.libraryDidChangeEvent) {
      observerManager.startObserving()
    }

    OnStopObserving(MediaLibraryNextModule.libraryDidChangeEvent) {
      observerManager.stopObserving()
    }

    // swiftlint:disable:next closure_body_length
    Class(Asset.self) {
      Constructor { (id: String) -> Asset in
        return Asset(id: id)
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

      AsyncFunction("getExif") { (this: Asset) in
        try await this.getExif()
      }

      AsyncFunction("getMediaSubtypes") { (this: Asset) in
        try await this.getMediaSubtypes()
      }

      AsyncFunction("getLivePhotoVideoUri") { (this: Asset) in
        try await this.getLivePhotoVideoUri()
      }

      AsyncFunction("getIsInCloud") { (this: Asset) in
        try await this.getIsInCloud()
      }

      AsyncFunction("getOrientation") { (this: Asset) in
        try await this.getOrientation()
      }

      AsyncFunction("getFilename") { (this: Asset) in
        try await this.getFilename()
      }

      AsyncFunction("getAlbums") { (this: Asset) in
        try await this.getAlbums()
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

      AsyncFunction("getLocation") { (this: Asset) in
        try await this.getLocation()
      }

      AsyncFunction("getShape") { (this: Asset) in
        try await this.getShape()
      }

      AsyncFunction("getUri") { (this: Asset) in
        try await this.getUri()
      }

      AsyncFunction("getWidth") { (this: Asset) in
        try await this.getWidth()
      }

      AsyncFunction("getInfo") { (this: Asset) in
        try await this.getInfo()
      }

      AsyncFunction("delete") { (this: Asset) in
        try await this.delete()
      }

      AsyncFunction("getFavorite") { (this: Asset) in
        try await this.getFavorite()
      }

      AsyncFunction("setFavorite") { (this: Asset, isFavorite: Bool) in
        try await this.setFavorite(isFavorite)
      }

      StaticAsyncFunction("create") { (filePath: URL, album: Album?) async throws in
        try await checkIfPermissionGranted()
        let newAssetId = try await AssetRepository.shared.add(from: filePath)
        if let guardedAlbum = album {
          guard let asset = AssetRepository.shared.get(by: [newAssetId]).first else {
            throw FailedToCreateAlbumException("Failed to fetch newly created asset")
          }
          try await AssetCollectionRepository.shared.add(assets: [asset], to: guardedAlbum.id)
        }
        return Asset(localIdentifier: newAssetId)
      }

      StaticAsyncFunction("delete") { (assets: [Asset]) async throws in
        try await checkIfPermissionGranted()
        let assetIds = assets.map { $0.localIdentifier }
        try await AssetRepository.shared.delete(by: assetIds)
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(Query.self) {
      Constructor {
        return Query()
      }

      Function("eq") { (this: Query, assetField: AssetField, value: Either<MediaTypeNext, Int>) in
        try this.eq(assetField, value)
      }

      Function("within") { (this: Query, assetField: AssetField, values: Either<[MediaTypeNext], [Int]>) in
        try this.within(assetField, values)
      }

      Function("gt") { (this: Query, assetField: AssetField, value: Int) in
        this.gt(assetField, value)
      }

      Function("gte") { (this: Query, assetField: AssetField, value: Int) in
        this.gte(assetField, value)
      }

      Function("lt") { (this: Query, assetField: AssetField, value: Int) in
        this.lt(assetField, value)
      }

      Function("lte") { (this: Query, assetField: AssetField, value: Int) in
        this.lte(assetField, value)
      }

      Function("limit") { (this: Query, limit: Int) in
        try this.limit(limit)
      }

      Function("offset") { (this: Query, offset: Int) in
        try this.offset(offset)
      }

      Function("album") { (this: Query, album: Album) in
        this.album(album)
      }

      Function("orderBy") { (this: Query, sortDescriptor: Either<SortDescriptor, AssetField>) in
        if sortDescriptor.is(SortDescriptor.self) {
          let sd = try sortDescriptor.as(SortDescriptor.self)
          return this.orderBy(sortDescriptor: sd)
        }
        let assetField = try sortDescriptor.as(AssetField.self)
        let sd = SortDescriptor(key: assetField)
        return this.orderBy(sortDescriptor: sd)
      }

      AsyncFunction("exe") { (this: Query) in
        try await this.exe()
      }
    }

    Class(Album.self) {
      Constructor { (id: String) -> Album in
        return Album(id: id)
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

      AsyncFunction("add") { (album: Album, assets: [Asset]) async throws in
        try await album.add(assets)
      }

      AsyncFunction("removeAssets") { (album: Album, assets: [Asset]) async throws in
        try await album.removeAssets(assets)
      }

      AsyncFunction("delete") { (album: Album) async throws in
        try await album.delete()
      }

      StaticAsyncFunction("getAll") {
        try await checkIfPermissionGranted()
        return try await Album.getAll()
      }

      StaticAsyncFunction("get") { (title: String) -> Album? in
        try await checkIfPermissionGranted()
        guard let collection = AssetCollectionRepository.shared.get(byTitle: title) else {
          return nil
        }
        return Album(id: collection.localIdentifier)
      }

      StaticAsyncFunction("delete") { (albums: [Album], deleteAssets: Bool?) async throws in
        try await checkIfPermissionGranted()
        let albumsIds = albums.map { $0.id }
        try await AssetCollectionRepository.shared.delete(by: albumsIds, deleteAssets: deleteAssets ?? false)
      }

      StaticAsyncFunction("create") { (name: String, assetRefs: Either<[Asset], [URL]>, moveAssets: Bool?) async throws -> Album in
        try await checkIfPermissionGranted()
        let assetIds = try await getAssetIdsFromAssetRefs(from: assetRefs)
        let newCollectionId = try await AssetCollectionRepository.shared.add(name: name)
        let phAssetsToAdd = AssetRepository.shared.get(by: assetIds)
        try await AssetCollectionRepository.shared.add(assets: phAssetsToAdd, to: newCollectionId)
        return Album(id: newCollectionId)
      }
    }

    AsyncFunction("getPermissionsAsync") { (writeOnly: Bool?, promise: Promise) in
      appContext?
        .permissions?
        .getPermissionUsingRequesterClass(
          requesterClass(writeOnly ?? false),
          resolve: promise.legacyResolver,
          reject: promise.legacyRejecter
        )
    }

    AsyncFunction("requestPermissionsAsync") { (writeOnly: Bool?, promise: Promise) in
      appContext?
        .permissions?
        .askForPermission(
          usingRequesterClass: requesterClass(writeOnly ?? false),
          resolve: promise.legacyResolver,
          reject: promise.legacyRejecter
        )
    }

    AsyncFunction("presentPermissionsPicker") { (_ mediaTypes: [String]?) in
      #if os(iOS)
      guard let vc = appContext?.utilities?.currentViewController() else {
        return
      }
      PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: vc)
      #endif
    }.runOnQueue(.main)
  }

  private func getAssetIdsFromAssetRefs(from assetRefs: Either<[Asset], [URL]>) async throws -> [String] {
    var localIdentifiers: [String] = []
    if assetRefs.is([Asset].self) {
      let assets = try assetRefs.as([Asset].self)
      localIdentifiers = assets.map { $0.localIdentifier }
      return localIdentifiers
    }
    if assetRefs.is([URL].self) {
      let filePaths = try assetRefs.as([URL].self)
      localIdentifiers = try await AssetRepository.shared.add(from: filePaths)
      return localIdentifiers
    }
    throw FailedToCreateAlbumException("Unsupported assetRefs type")
  }

  private func checkIfPermissionGranted() async throws {
    try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
      appContext?.permissions?.getPermissionUsingRequesterClass(
        MediaLibraryPermissionRequester.self,
        resolve: { result in
          if let permissions = result as? [String: Any] {
            if permissions["status"] as? String != "granted" ||
              permissions["accessPrivileges"] as? String != "all" {
              continuation.resume(throwing: FailedToGrantPermissions())
              return
            }
            continuation.resume(returning: ())
            return
          }
          continuation.resume(throwing: FailedToGrantPermissions())
        },
        reject: { _, _, error in
          if let error = error {
            continuation.resume(throwing: error)
          } else {
            continuation.resume(throwing: FailedToGrantPermissions())
          }
        }
      )
    }
  }
}
