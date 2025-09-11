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

    Constant("MediaType") {
      [
        "audio": "audio",
        "photo": "photo",
        "video": "video",
        "unknown": "unknown",
        "all": "all"
      ]
    }

    Constant("SortBy") {
      [
        "default": "default",
        "creationTime": "creationTime",
        "modificationTime": "modificationTime",
        "mediaType": "mediaType",
        "width": "width",
        "height": "height",
        "duration": "duration"
      ]
    }

    Constant("CHANGE_LISTENER_NAME") {
      "mediaLibraryDidChange"
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
      #if os(iOS)
      guard let vc = appContext?.utilities?.currentViewController() else {
        return
      }
      PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: vc)
      #endif
    }.runOnQueue(.main)

    AsyncFunction("createAssetAsync") { (uri: URL, albumId: String?, promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      createAsset(uri: uri, appContext: appContext) { asset, error in
        guard let asset else {
          promise.reject(error ?? SaveAssetException(nil))
          return
        }

        guard let albumId else {
          promise.resolve(exportAsset(asset: asset))
          return
        }

        addAssets(ids: [asset.localIdentifier], to: albumId) { success, error in
          if success {
            promise.resolve(exportAsset(asset: asset))
          } else {
            promise.reject(error ?? SaveAssetException(nil))
          }
        }
      }
    }

    AsyncFunction("saveToLibraryAsync") { (localUrl: URL, promise: Promise) in
      #if os(iOS)
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
      #endif

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

    AsyncFunction("createAlbumAsync") { (title: String, assetId: String?, initialAssetUri: URL?, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        createAlbum(with: title) { [weak self] collection, createError in
          guard let collection else {
            promise.reject(CreateAlbumFailedException(createError))
            return
          }

          if assetId == nil && initialAssetUri == nil {
            promise.resolve(exportCollection(collection))
            return
          }

          if let assetId {
            addAssets(ids: [assetId], to: collection.localIdentifier) { success, addError in
              if success {
                promise.resolve(exportCollection(collection))
              } else {
                promise.reject(FailedToAddAssetException(addError))
              }
            }
            return
          }

          if let initialAssetUri {
            createAsset(uri: initialAssetUri, appContext: self?.appContext) { asset, error in
              if let error {
                promise.reject(error)
                return
              }
              if let asset {
                addAssets(ids: [asset.localIdentifier], to: collection.localIdentifier) { success, addError in
                  if success {
                    promise.resolve(exportCollection(collection))
                  } else {
                    promise.reject(FailedToAddAssetException(addError))
                  }
                }
              }
            }
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

  private func handleLivePhoto(asset: PHAsset, shouldDownloadFromNetwork: Bool, result: [String: Any?], promise: Promise) {
    let livePhotoOptions = PHLivePhotoRequestOptions()
    livePhotoOptions.isNetworkAccessAllowed = shouldDownloadFromNetwork
    var updatedResult = result
      updatedResult["pairedVideoAsset"] = nil

    PHImageManager.default()
      .requestLivePhoto(for: asset, targetSize: PHImageManagerMaximumSize, contentMode: .aspectFit, options: livePhotoOptions) { livePhoto, _ in
      guard let livePhoto = livePhoto,
        let videoResource = PHAssetResource.assetResources(for: livePhoto)
        .first(where: { $0.type == .pairedVideo }) else {
        promise.resolve(updatedResult)
        return
      }
      self.writePairedVideoAsset(videoResource: videoResource, asset: asset, result: updatedResult, promise: promise)
      }
  }

  private func writePairedVideoAsset(videoResource: PHAssetResource, asset: PHAsset, result: [String: Any?], promise: Promise) {
    let fileName = videoResource.originalFilename
    let tempDir = FileManager.default.temporaryDirectory
    let fileExt = getFileExtension(from: fileName).replacingOccurrences(of: ".", with: "")
    let tempId = UUID().uuidString
    let fileUrl = tempDir.appendingPathComponent(tempId).appendingPathExtension(fileExt)
    var width = CGFloat(asset.pixelWidth)
    var height = CGFloat(asset.pixelHeight)
    PHAssetResourceManager.default().writeData(for: videoResource, toFile: fileUrl, options: nil) { error in
      guard error == nil else {
        promise.resolve(result)
        return
      }
      let avAsset = AVAsset(url: fileUrl)
      let duration = avAsset.duration.seconds
      // The video resouece of a paired photo may have different dimensions from the original photo
      if let videoSize = readSizeFrom(url: fileUrl) {
        width = videoSize.width
        height = videoSize.height
      }
      let pairedVideoAsset: [String: Any?] = [
        "id": tempId,
        "filename": fileName,
        "uri": fileUrl.absoluteString,
        "mediaType": "pairedVideo",
        "mediaSubtypes": [],
        "width": width,
        "height": height,
        "duration": duration,
        "creationTime": exportDate(asset.creationDate),
        "modificationTime": exportDate(asset.modificationDate)
      ]
      var updatedResult = result
      updatedResult["pairedVideoAsset"] = pairedVideoAsset
      promise.resolve(updatedResult)
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

      result["pairedVideoAsset"] = nil

      if asset.mediaSubtypes.contains(.photoLive) {
        self.handleLivePhoto(asset: asset, shouldDownloadFromNetwork: options .shouldDownloadFromNetwork, result: result, promise: promise)
      } else {
        promise.resolve(result)
      }
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
      let videoOutputFileName =
        "slowMoVideo-\(Int.random(in: 0...999)).mov"
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

          for asset in changeDetails.insertedObjects {
            insertedAssets.append(exportAsset(asset: asset))
          }

          for asset in changeDetails.removedObjects {
            deletedAssets.append(exportAsset(asset: asset))
          }

          for asset in changeDetails.changedObjects {
            updatedAssets.append(exportAsset(asset: asset))
          }

          let body: [String: Any] = [
            "hasIncrementalChanges": true,
            "insertedAssets": insertedAssets,
            "deletedAssets": deletedAssets,
            "updatedAssets": updatedAssets
          ]

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
