import ExpoModulesCore
import Photos
import PhotosUI

public final class MediaLibraryNextModule: Module {
  private static let libraryDidChangeEvent = "mediaLibraryDidChange"
  private let assetMapper = AssetMapper()
  private lazy var permissionDelegate = MediaLibraryNextPermissionDelegate(appContext: appContext)
  private lazy var observerManager = PhotoLibraryObserverManager(onChange: { [weak self] body in
    guard let self = self else {
      return
    }
    self.sendEvent(MediaLibraryNextModule.libraryDidChangeEvent, body)
  })

  public func definition() -> ModuleDefinition {
    Name("ExpoMediaLibraryNext")

    Events(MediaLibraryNextModule.libraryDidChangeEvent)

    OnCreate {
      permissionDelegate.registerPermissionRequesters()
    }

    OnStartObserving(MediaLibraryNextModule.libraryDidChangeEvent) {
      observerManager.startObserving()
    }

    OnStopObserving(MediaLibraryNextModule.libraryDidChangeEvent) {
      observerManager.stopObserving()
    }

    // swiftlint:disable:next closure_body_length
    Class(Asset.self) {
      Constructor { (id: String) -> Asset in
        return Asset(id: id, assetMapper: assetMapper)
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
        try await permissionDelegate.checkIfWritePermissionGranted()
        let newAssetId = try await AssetRepository.shared.add(from: filePath)
        if let guardedAlbum = album {
          guard let asset = AssetRepository.shared.get(by: [newAssetId]).first else {
            throw FailedToCreateAlbumException("Failed to fetch newly created asset")
          }
          try await AssetCollectionRepository.shared.add(assets: [asset], to: guardedAlbum.id)
        }
        return Asset(localIdentifier: newAssetId, assetMapper: assetMapper)
      }

      StaticAsyncFunction("delete") { (assets: [Asset]) async throws in
        try await permissionDelegate.checkIfReadWritePermissionGranted()
        let assetIds = assets.map { $0.localIdentifier }
        try await AssetRepository.shared.delete(by: assetIds)
      }
    }

    // swiftlint:disable:next closure_body_length
    Class(Query.self) {
      Constructor {
        return Query(assetMapper: assetMapper)
      }

      Function("eq") { (this: Query, assetField: AssetField, value: EitherOfThree<MediaTypeNext, Int, Bool>) in
        try this.eq(assetField, value)
      }

      Function("within") { (this: Query, assetField: AssetField, values: EitherOfThree<[MediaTypeNext], [Int], [Bool]>) in
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

      AsyncFunction("exeForMetadata") { (this: Query) in
        try await this.exeForMetadata()
      }
    }

    Class(Album.self) {
      Constructor { (id: String) -> Album in
        return Album(id: id, assetMapper: assetMapper)
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

      AsyncFunction("getType") { (album: Album) async throws in
        try await album.getType()
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
        try await permissionDelegate.checkIfFullAccessGranted()
        return try await Album.getAll(assetMapper: assetMapper)
      }

      StaticAsyncFunction("getSmartAlbums") {
        try await permissionDelegate.checkIfFullAccessGranted()
        return try await Album.getSmartAlbums(assetMapper: assetMapper)
      }

      StaticAsyncFunction("get") { (title: String) -> Album? in
        try await permissionDelegate.checkIfFullAccessGranted()
        guard let collection = AssetCollectionRepository.shared.get(byTitle: title) else {
          return nil
        }
        return Album(id: collection.localIdentifier, assetMapper: assetMapper)
      }

      StaticAsyncFunction("delete") { (albums: [Album], deleteAssets: Bool?) async throws in
        try await permissionDelegate.checkIfFullAccessGranted()
        let albumsIds = albums.map { $0.id }
        try await AssetCollectionRepository.shared.delete(by: albumsIds, deleteAssets: deleteAssets ?? false)
      }

      StaticAsyncFunction("create") { (name: String, assetRefs: Either<[Asset], [URL]>, moveAssets: Bool?) async throws -> Album in
        try await permissionDelegate.checkIfFullAccessGranted()
        let assetIds = try await getAssetIdsFromAssetRefs(from: assetRefs)
        let newCollectionId = try await AssetCollectionRepository.shared.add(name: name)
        let phAssetsToAdd = AssetRepository.shared.get(by: assetIds)
        try await AssetCollectionRepository.shared.add(assets: phAssetsToAdd, to: newCollectionId)
        return Album(id: newCollectionId, assetMapper: assetMapper)
      }
    }

    AsyncFunction("getPermissionsAsync") { (writeOnly: Bool?, promise: Promise) in
      try permissionDelegate.getPermissions(writeOnly: writeOnly ?? false, promise: promise)
    }

    AsyncFunction("requestPermissionsAsync") { (writeOnly: Bool?, promise: Promise) in
      try permissionDelegate.requestPermissions(writeOnly: writeOnly ?? false, promise: promise)
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
}
