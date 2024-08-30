import ExpoModulesCore
import PhotosUI

public class MediaLibraryModule: Module, PhotoLibraryObserverHandler {
  private var allAssetsFetchResult: PHFetchResult<PHAsset>?
  private var writeOnly = false
  private var delegates = Set<SaveToLibraryDelegate>()
  private var changeDelegate: PhotoLibraryObserver?

  // swiftlint:disable:next cyclomatic_complexity
  public func definition() -> ModuleDefinition {
    Name("ExpoMediaLibrary")

    Events("mediaLibraryDidChange")

    Constants {
      [
        "MediaType": [
          "audio": "audio",
          "photo": "photo",
          "video": "video",
          "unknown": "unknown",
          "all": "all"
        ],
        "SortBy": [
          "default": "default",
          "creationTime": "creationTime",
          "modificationTime": "modificationTime",
          "mediaType": "mediaType",
          "width": "width",
          "height": "height",
          "duration": "duration"
        ],
        "CHANGE_LISTENER_NAME": "mediaLibraryDidChange"
      ]
    }

    OnCreate {
      appContext?.permissions?.register([
        MediaLibraryPermissionRequester(),
        MediaLibraryWriteOnlyPermissionRequester()
      ])
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

    AsyncFunction("presentPermissionsPickerAsync") {
      guard let vc = appContext?.utilities?.currentViewController() else {
        return
      }
      PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: vc)
    }.runOnQueue(.main)

    AsyncFunction("createAssetAsync") { (uri: URL, promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      if uri.pathExtension.isEmpty {
        promise.reject(EmptyFileExtensionException())
        return
      }

      let assetType = assetType(for: uri)
      if assetType == .unknown || assetType == .audio {
        promise.reject(UnsupportedAssetTypeException(uri.absoluteString))
        return
      }

      if !FileSystemUtilities.permissions(appContext, for: uri).contains(.read) {
        promise.reject(UnreadableAssetException(uri.absoluteString))
        return
      }

      var assetPlaceholder: PHObjectPlaceholder?
      PHPhotoLibrary.shared().performChanges {
        let changeRequest = assetType == .video
        ? PHAssetChangeRequest.creationRequestForAssetFromVideo(atFileURL: uri)
        : PHAssetChangeRequest.creationRequestForAssetFromImage(atFileURL: uri)

        assetPlaceholder = changeRequest?.placeholderForCreatedAsset
      } completionHandler: { success, error in
        if success {
          let asset = getAssetBy(id: assetPlaceholder?.localIdentifier)
          promise.resolve(exportAsset(asset: asset))
        } else {
          promise.reject(SaveAssetException(error))
        }
      }
    }

    AsyncFunction("saveToLibraryAsync") { (localUrl: URL, promise: Promise) in
      if Bundle.main.infoDictionary?["NSPhotoLibraryAddUsageDescription"] == nil {
        throw MissingPListKeyException("NSPhotoLibraryAddUsageDescription")
      }

      if localUrl.pathExtension.isEmpty {
        promise.reject(EmptyFileExtensionException())
        return
      }

      let assetType = assetType(for: localUrl)
      let delegate = SaveToLibraryDelegate()
      delegates.insert(delegate)

      let callback: SaveToLibraryCallback = { [weak self] _, error in
        guard let self else {
          return
        }
        self.delegates.remove(delegate)
        guard error == nil else {
          promise.reject(SaveAssetException(error))
          return
        }
        promise.resolve()
      }

      if assetType == .image {
        if localUrl.pathExtension.lowercased() == "gif" {
          delegate.writeGIF(localUrl, withCallback: callback)
          return
        }

        guard let image = UIImage(data: try Data(contentsOf: localUrl)) else {
          promise.reject(MissingFileException(localUrl.absoluteString))
          return
        }
        delegate.writeImage(image, withCallback: callback)
        return
      } else if assetType == .video {
        if UIVideoAtPathIsCompatibleWithSavedPhotosAlbum(localUrl.path) {
          delegate.writeVideo(localUrl, withCallback: callback)
          return
        }
        promise.reject(SaveVideoException())
        return
      }

      promise.reject(UnsupportedAssetException())
    }

    AsyncFunction("addAssetsToAlbumAsync") { (assetIds: [String], album: String, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        addAssets(ids: assetIds, to: album) { success, error in
          if success {
            promise.resolve(success)
          } else {
            promise.reject(SaveAlbumException(error))
          }
        }
      }
    }

    AsyncFunction("removeAssetsFromAlbumAsync") { (assetIds: [String], album: String, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        PHPhotoLibrary.shared().performChanges {
          guard let collection = getAlbum(by: album) else {
            return
          }
          let assets = getAssetsBy(assetIds: assetIds)

          let albumChangeRequest = PHAssetCollectionChangeRequest(for: collection, assets: assets)
          albumChangeRequest?.removeAssets(assets)
        } completionHandler: { success, error in
          if success {
            promise.resolve(success)
          } else {
            promise.reject(RemoveFromAlbumException(error))
          }
        }
      }
    }

    AsyncFunction("deleteAssetsAsync") { (assetIds: [String], promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      PHPhotoLibrary.shared().performChanges {
        let fetched = PHAsset.fetchAssets(withLocalIdentifiers: assetIds, options: nil)
        PHAssetChangeRequest.deleteAssets(fetched)
      } completionHandler: { success, error in
        if success {
          promise.resolve(success)
        } else {
          promise.reject(RemoveAssetsException(error))
        }
      }
    }

    AsyncFunction("getAlbumsAsync") { (options: AlbumOptions, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        var albums = [[String: Any?]?]()
        let fetchOptions = PHFetchOptions()
        fetchOptions.includeHiddenAssets = false
        fetchOptions.includeAllBurstAssets = false

        let useAlbumsfetchResult = PHCollectionList.fetchTopLevelUserCollections(with: fetchOptions)

        let collections = exportCollections(collections: useAlbumsfetchResult, with: fetchOptions, in: nil)
        albums.append(contentsOf: collections)

        if options.includeSmartAlbums {
          let smartAlbumsFetchResult = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: .any, options: fetchOptions)
          albums.append(contentsOf: exportCollections(collections: smartAlbumsFetchResult, with: fetchOptions, in: nil))
        }

        promise.resolve(albums)
      }
    }

    AsyncFunction("getMomentsAsync") { (promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      let options = PHFetchOptions()
      options.includeHiddenAssets = false
      options.includeAllBurstAssets = false

      let fetchResult = PHAssetCollection.fetchMoments(with: options)
      let albums = exportCollections(collections: fetchResult, with: options, in: nil)

      promise.resolve(albums)
    }

    AsyncFunction("getAlbumAsync") { (title: String, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        let collection = getAlbum(with: title)
        promise.resolve(exportCollection(collection))
      }
    }

    AsyncFunction("createAlbumAsync") { (title: String, assetId: String?, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        createAlbum(with: title) { collection, createError in
          if let collection {
            if let assetId {
              addAssets(ids: [assetId], to: collection.localIdentifier) { success, addError in
                if success {
                  promise.resolve(exportCollection(collection))
                } else {
                  promise.reject(FailedToAddAssetException(addError))
                }
              }
            } else {
              promise.resolve(exportCollection(collection))
            }
          } else {
            promise.reject(CreateAlbumFailedException(createError))
          }
        }
      }
    }

    AsyncFunction("deleteAlbumsAsync") { (albumIds: [String], removeAsset: Bool, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        let collections = getAlbums(by: albumIds)
        PHPhotoLibrary.shared().performChanges {
          if removeAsset {
            collections.enumerateObjects { collection, _, _ in
              let fetch = PHAsset.fetchAssets(in: collection, options: nil)
              PHAssetChangeRequest.deleteAssets(fetch)
            }
          }
          PHAssetCollectionChangeRequest.deleteAssetCollections(collections)
        } completionHandler: { success, error in
          if success {
            promise.resolve(success)
          } else {
            promise.reject(DeleteAlbumFailedException(error))
          }
        }
      }
    }

    AsyncFunction("getAssetInfoAsync") { (assetId: String?, options: AssetInfoOptions, promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      guard let asset = getAssetBy(id: assetId) else {
        promise.resolve(nil)
        return
      }

      if asset.mediaType == .image {
        resolveImage(asset: asset, options: options, promise: promise)
      } else {
        resolveVideo(asset: asset, options: options, promise: promise)
      }
    }

    AsyncFunction("getAssetsAsync") { (options: AssetWithOptions, promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      if let albumId = options.album {
        runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
          let collection = getAlbum(by: albumId)
          getAssetsWithAfter(options: options, collection: collection, promise: promise)
        }
      } else {
        getAssetsWithAfter(options: options, collection: nil, promise: promise)
      }
    }

    OnStartObserving {
      allAssetsFetchResult = getAllAssets()
      let delegate = PhotoLibraryObserver(handler: self)
      self.changeDelegate = delegate
      PHPhotoLibrary.shared().register(delegate)
    }

    OnStopObserving {
      changeDelegate = nil
      allAssetsFetchResult = nil
    }
  }

  private func resolveImage(asset: PHAsset, options: AssetInfoOptions, promise: Promise) {
    var result = exportAssetInfo(asset: asset) ?? [:]
    let imageOptions = PHContentEditingInputRequestOptions()
    imageOptions.isNetworkAccessAllowed = options.shouldDownloadFromNetwork

    asset.requestContentEditingInput(with: imageOptions) { contentInput, info in
      result["localUri"] = contentInput?.fullSizeImageURL?.absoluteString
      result["orientation"] = contentInput?.fullSizeImageOrientation
      if !options.shouldDownloadFromNetwork {
        result["isNetworkAsset"] = info[PHContentEditingInputResultIsInCloudKey] ?? false
      }

      if let url = contentInput?.fullSizeImageURL, let ciImage = CIImage(contentsOf: url) {
        result["exif"] = ciImage.properties
      }
      promise.resolve(result)
    }
  }

  private func resolveVideo(asset: PHAsset, options: AssetInfoOptions, promise: Promise) {
    var result = exportAssetInfo(asset: asset) ?? [:]
    let videoOptions = PHVideoRequestOptions()
    videoOptions.isNetworkAccessAllowed = options.shouldDownloadFromNetwork

    PHImageManager.default().requestAVAsset(forVideo: asset, options: videoOptions) { asset, _, info in
      guard let asset = asset as? AVComposition else {
        let urlAsset = asset as? AVURLAsset
        result["localUri"] = urlAsset?.url.absoluteString
        if !options.shouldDownloadFromNetwork {
          result["isNetworkAsset"] = info?[PHImageResultIsInCloudKey] ?? false
        }
        promise.resolve(result)
        return
      }

      let directory = self.appContext?.config.cacheDirectory?.appendingPathComponent("MediaLibrary")
      FileSystemUtilities.ensureDirExists(at: directory)
      let videoOutputFileName = "slowMoVideo-\(Int.random(in: 0...999)).mov"
      guard let videoFileOutputPath = directory?.appendingPathComponent(videoOutputFileName) else {
        promise.reject(InvalidPathException())
        return
      }

      let videoFileOutputURL = URL(string: videoFileOutputPath.path)

      let exporter = AVAssetExportSession(asset: asset, presetName: AVAssetExportPresetHighestQuality)
      exporter?.outputURL = videoFileOutputURL
      exporter?.outputFileType = AVFileType.mov
      exporter?.shouldOptimizeForNetworkUse = true

      exporter?.exportAsynchronously {
        switch exporter?.status {
        case .completed:
          result["localUri"] = videoFileOutputURL?.absoluteString
          if !options.shouldDownloadFromNetwork {
            result["isNetworkAsset"] = info?[PHImageResultIsInCloudKey] ?? false
          }

          promise.resolve(result)
        case .failed:
          promise.reject(ExportSessionFailedException())
        case .cancelled:
          promise.reject(ExportSessionCancelledException())
        default:
          promise.reject(ExportSessionUnknownException())
        }
      }
    }
  }

  private func checkPermissions(promise: Promise) -> Bool {
    guard let permissions = appContext?.permissions else {
      promise.reject(MediaLibraryPermissionsException())
      return false
    }
    if !permissions.hasGrantedPermission(usingRequesterClass: requesterClass(self.writeOnly)) {
      promise.reject(MediaLibraryPermissionsException())
      return false
    }
    return true
  }

  private func runIfAllPermissionsWereGranted(reject: @escaping EXPromiseRejectBlock, block: @escaping () -> Void) {
    appContext?.permissions?.getPermissionUsingRequesterClass(
      MediaLibraryPermissionRequester.self,
      resolve: { result in
        if let permissions = result as? [String: Any] {
          if permissions["status"] as? String != "granted" {
            reject("E_NO_PERMISSIONS", "MEDIA_LIBRARY permission is required to do this operation.", nil)
            return
          }
          if permissions["accessPrivileges"] as? String != "all" {
            reject("E_NO_PERMISSIONS", "MEDIA_LIBRARY permission is required to do this operation.", nil)
            return
          }
          block()
        }
      },
      reject: reject)
  }

  func didChange(_ changeInstance: PHChange) {
    if let allAssetsFetchResult {
      let changeDetails = changeInstance.changeDetails(for: allAssetsFetchResult)

      if let changeDetails {
        self.allAssetsFetchResult = changeDetails.fetchResultAfterChanges

        if changeDetails.hasIncrementalChanges && !changeDetails.insertedObjects.isEmpty || !changeDetails.removedObjects.isEmpty {
          var insertedAssets = [[String: Any?]?]()
          var deletedAssets = [[String: Any?]?]()
          var updatedAssets = [[String: Any?]?]()
          let body: [String: Any] = [
            "hasIncrementalChanges": true,
            "insertedAssets": insertedAssets,
            "deletedAssets": deletedAssets,
            "updatedAssets": updatedAssets
          ]

          for asset in changeDetails.insertedObjects {
            insertedAssets.append(exportAsset(asset: asset))
          }

          for asset in changeDetails.removedObjects {
            deletedAssets.append(exportAsset(asset: asset))
          }

          for asset in changeDetails.changedObjects {
            updatedAssets.append(exportAsset(asset: asset))
          }

          sendEvent("mediaLibraryDidChange", body)
          return
        }

        if !changeDetails.hasIncrementalChanges {
          sendEvent("mediaLibraryDidChange", [
            "hasIncrementalChanges": false
          ])
        }
      }
    }
  }
}
