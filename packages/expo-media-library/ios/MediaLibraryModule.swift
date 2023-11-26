import ExpoModulesCore
import PhotosUI
import Foundation
import CoreServices

public class MediaLibraryModule: Module, PhotoLibraryObserverHandler {
  private var allAssetsFetchResult: PHFetchResult<PHAsset>?
  private var writeOnly = false
  private var delegates = Set<SaveToLibraryDelegate>()
  private var changeDelegate: PhotoLibraryObserver?

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
        "CHANGE_LISTENER_NAME": "mediaLibraryDidChange"]
    }

    OnCreate {
      appContext?.permissions?.register([
        MediaLibraryPermissionRequester(),
        MediaLibraryWriteOnlyPermissionRequester()
      ])
    }

    AsyncFunction("getPermissionsAsync") { (writeOnly: Bool, promise: Promise) in
      self.writeOnly = writeOnly
      appContext?.permissions?.getPermissionUsingRequesterClass(requesterClass(writeOnly), resolve: promise.resolver, reject: promise.legacyRejecter)
    }

    AsyncFunction("requestPermissionsAsync") { (writeOnly: Bool, promise: Promise) in
      self.writeOnly = writeOnly
      appContext?.permissions?.askForPermission(usingRequesterClass: requesterClass(writeOnly), resolve: promise.resolver, reject: promise.legacyRejecter)
    }

    AsyncFunction("presentPermissionsPickerAsync") {
      if #available(iOS 15.0, *) {
        guard let vc = appContext?.utilities?.currentViewController() else {
          return
        }
        PHPhotoLibrary.shared().presentLimitedLibraryPicker(from: vc)
      } else {
        throw MethodUnavailableException()
      }
    }.runOnQueue(.main)

    AsyncFunction("createAssetAsync") { (uri: URL, promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      if uri.pathExtension.isEmpty {
        promise.reject(FileExtensionException())
        return
      }

      let assetType = assetType(for: uri)
      if assetType == .unknown || assetType == .audio {
        promise.reject(UnsupportedAssetTypeException())
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
      } completionHandler: { success, _ in
        if success {
          let asset = self.getAssetBy(id: assetPlaceholder?.localIdentifier)
          promise.resolve(self.exportAsset(asset: asset))
        } else {
          promise.reject(SaveAssetException())
        }
      }
    }

    AsyncFunction("saveToLibraryAsync") { (localUrl: URL, promise: Promise) in
      if Bundle.main.infoDictionary?["NSPhotoLibraryAddUsageDescription"] == nil {
        throw MissingPListKeyException("NSPhotoLibraryAddUsageDescription")
      }

      if localUrl.pathExtension.isEmpty {
        throw FileExtensionException()
      }

      let assetType = assetType(for: localUrl)
      let delegate = SaveToLibraryDelegate()
      delegates.insert(delegate)
      let callback: SaveToLibraryCallback = { [weak self] _, _ in
        guard let self else {
          return
        }
        self.delegates.remove(delegate)
        if let error {
          promise.reject(SaveAssetException())
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
        self.addAssets(ids: assetIds, to: album) { success, _ in
          if success {
            promise.resolve(success)
          } else {
            promise.reject(SaveAlbumException())
          }
        }
      }
    }

    AsyncFunction("removeAssetsFromAlbumAsync") { (assetIds: [String], album: String, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        PHPhotoLibrary.shared().performChanges {
          guard let collection = self.getAlbum(by: album) else {
            return
          }
          let assets = self.getAssetsBy(assetIds: assetIds)

          let collectionAssets = PHAsset.fetchAssets(in: collection, options: nil)
          let albumChangeRequest = PHAssetCollectionChangeRequest(for: collection, assets: assets)
          albumChangeRequest?.removeAssets(assets)
        } completionHandler: { success, _ in
          if success {
            promise.resolve(success)
          } else {
            promise.reject(RemoveFromAlbumException())
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
      } completionHandler: { success, _ in
        if success {
          promise.resolve(success)
        } else {
          promise.reject(RemoveAssetsException())
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

        let collections = self.exportCollections(collections: useAlbumsfetchResult, with: fetchOptions, in: nil)
        albums.append(contentsOf: collections)

        if options.includeSmartAlbums {
          let smartAlbumsFetchResult = PHAssetCollection.fetchAssetCollections(with: .smartAlbum, subtype: .any, options: fetchOptions)
          albums.append(contentsOf: self.exportCollections(collections: smartAlbumsFetchResult, with: fetchOptions, in: nil))
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
        let collection = self.getAlbum(with: title)
        promise.resolve(self.exportCollection(collection))
      }
    }

    AsyncFunction("createAlbumAsync") { (title: String, assetId: String?, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        self.createAlbum(with: title) { collection, _ in
          if let collection {
            if let assetId {
              self.addAssets(ids: [assetId], to: collection.localIdentifier) { success, _ in
                if success {
                  promise.resolve(self.exportCollection(collection))
                } else {
                  promise.reject(FailedToAddAssetException())
                }
              }
            } else {
              promise.resolve(self.exportCollection(collection))
            }
          } else {
            promise.reject(CreateAlbumFailedException())
          }
        }
      }
    }

    AsyncFunction("deleteAlbumsAsync") { (albumIds: [String], removeAsset: Bool, promise: Promise) in
      runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
        let collections = self.getAlbums(by: albumIds)
        PHPhotoLibrary.shared().performChanges {
          if removeAsset {
            collections.enumerateObjects { collection, _, _ in
              let fetch = PHAsset.fetchAssets(in: collection, options: nil)
              PHAssetChangeRequest.deleteAssets(fetch)
            }
          }
          PHAssetCollectionChangeRequest.deleteAssetCollections(collections)
        } completionHandler: { success, _ in
          if success {
            promise.resolve(success)
          } else {
            promise.reject(DeleteAlbumFailedException())
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
      var result = exportAssetInfo(asset: asset) ?? [:]

      if asset.mediaType == .image {
        let imageOptions = PHContentEditingInputRequestOptions()
        imageOptions.isNetworkAccessAllowed = options.shouldDownloadFromNetwork

        asset.requestContentEditingInput(with: imageOptions) { contentInput, info in
          result["localUri"] = contentInput?.fullSizeImageURL?.absoluteString
          result["orientation"] = contentInput?.fullSizeImageOrientation
          if !options.shouldDownloadFromNetwork {
            result["isNetworkAsset"] = info[PHContentEditingInputResultIsInCloudKey] != nil
            ? info[PHContentEditingInputResultIsInCloudKey]
            :false
          }

          if let url = contentInput?.fullSizeImageURL, let ciImage = CIImage(contentsOf: url) {
            result["exif"] = ciImage.properties
          }
          promise.resolve(result)
        }
      } else {
        let videoOptions = PHVideoRequestOptions()
        videoOptions.isNetworkAccessAllowed = options.shouldDownloadFromNetwork

        PHImageManager.default().requestAVAsset(forVideo: asset, options: videoOptions) { asset, _, info in
          if let asset = asset as? AVComposition {
            let directory = self.appContext?.config.cacheDirectory?.appendingPathComponent("MediaLibrary")
            FileSystemUtilities.ensureDirExists(at: directory)
            let videoOutputFileName = "slowMoVideo-\(arc4random() % 1000).mov"
            guard let videoFileOutputPath = directory?.appendingPathComponent(videoOutputFileName) else {
              // TODO: ERROR
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
                  result["isNetworkAsset"] = info?[PHImageResultIsInCloudKey] != nil ? info?[PHImageResultIsInCloudKey]
                  : false
                }

                promise.resolve(result)
              case .failed:
                promise.reject("E_EXPORT_FAILED", "Could not export the requested video.")
              case .cancelled:
                promise.reject("E_EXPORT_FAILED", "Could not export the requested video.")
              default:
                promise.reject("E_EXPORT_FAILED", "Could not export the requested video.")
              }
            }
          } else {
            let urlAsset = asset as? AVURLAsset
            result["localUri"] = urlAsset?.url.absoluteString
            if !options.shouldDownloadFromNetwork {
              result["isNetworkAsset"] = info?[PHImageResultIsInCloudKey] != nil
              ? info?[PHImageResultIsInCloudKey]
              : false
            }
            promise.resolve(result)
          }
        }
      }
    }

    AsyncFunction("getAssetsAsync") { (options: AssetWithOptions, promise: Promise) in
      if !checkPermissions(promise: promise) {
        return
      }

      if let albumId = options.album {
        runIfAllPermissionsWereGranted(reject: promise.legacyRejecter) {
          let collection = self.getAlbum(by: albumId)
          self.getAssetsWithAfter(options: options, collection: collection, promise: promise)
        }
      } else {
        self.getAssetsWithAfter(options: options, collection: nil, promise: promise)
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

  private func getAllAssets() -> PHFetchResult<PHAsset> {
    let options = PHFetchOptions()
    options.includeAssetSourceTypes = PHAssetSourceType.typeUserLibrary
    options.includeHiddenAssets = false
    options.includeHiddenAssets = false
    return PHAsset.fetchAssets(with: options)
  }

  private func addAssets(ids: [String], to album: String, with callback: @escaping (Bool, Error?) -> Void) {
    PHPhotoLibrary.shared().performChanges({
      guard let collection = self.getAlbum(by: album) else {
        return
      }
      let assets = self.getAssetsBy(assetIds: ids)

      let collectionAssets = PHAsset.fetchAssets(in: collection, options: nil)
      let albumChangeRequest = PHAssetCollectionChangeRequest(for: collection, assets: collectionAssets)
      albumChangeRequest?.addAssets(assets as NSFastEnumeration)
    }, completionHandler: callback)
  }

  private func getAlbum(by id: String) -> PHAssetCollection? {
    let options = PHFetchOptions()
    options.fetchLimit = 1
    return PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [id], options: options).firstObject
  }

  private func getAlbums(by ids: [String]) -> PHFetchResult<PHAssetCollection> {
    let options = PHFetchOptions()
    return PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: ids, options: options)
  }

  private func ensureAlbumWith(title: String, completion: @escaping (PHAssetCollection?, Error?) -> Void) {

    if let collection = getAlbum(with: title) {
      completion(collection, nil)
      return
    }
    createAlbum(with: title, completion: completion)
  }

  private func createAlbum(with title: String, completion: @escaping (PHAssetCollection?, Error?) -> Void) {
    var collectionPlaceholder: PHObjectPlaceholder?

    PHPhotoLibrary.shared().performChanges {
      let changeRequest = PHAssetCollectionChangeRequest.creationRequestForAssetCollection(withTitle: title)
      collectionPlaceholder = changeRequest.placeholderForCreatedAssetCollection
    } completionHandler: { success, error in
      if success {
        if let collectionPlaceholder {
          let fetchResult = PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [collectionPlaceholder.localIdentifier], options: nil)
          completion(fetchResult.firstObject, nil)
        }
      } else {
        completion(nil, error)
      }
    }
  }

  private func getAlbum(with title: String) -> PHAssetCollection? {
    let options = PHFetchOptions()
    options.predicate = NSPredicate(format: "title == %@", title)
    options.fetchLimit = 1

    let fetchResult = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: options)

    return fetchResult.firstObject
  }

  private func exportCollections(collections: PHFetchResult<PHCollection>, with options: PHFetchOptions, in folder: String?) -> [[String: Any?]?] {
    var albums = [[String: Any?]?]()
    collections.enumerateObjects { collection, _, _ in
      if let assetCollection = collection as? PHAssetCollection {
        if let folder {
          albums.append(
            self.exportCollection(assetCollection, folderName: folder))
        } else {
          albums.append(self.exportCollection(assetCollection, folderName: nil))
        }
      } else if let collectionList = collection as? PHCollectionList {
        let collectionsInFolder = PHCollectionList.fetchCollections(in: collectionList, options: options)
        albums.append(contentsOf: self.exportCollections(collections: collectionsInFolder, with: options, in: collectionList.localizedTitle))
      }
    }

    return albums
  }

  private func exportCollections(collections: PHFetchResult<PHAssetCollection>, with options: PHFetchOptions, in folder: String?) -> [[String: Any?]?] {
    var albums = [[String: Any?]?]()
    collections.enumerateObjects { collection, _, _ in
      if let assetCollection = collection as? PHAssetCollection {
        if let folder {
          albums.append(
            self.exportCollection(assetCollection, folderName: folder))
        } else {
          albums.append(self.exportCollection(assetCollection, folderName: nil))
        }
      } else if let collectionList = collection as? PHCollectionList {
        let collectionsInFolder = PHCollectionList.fetchCollections(in: collectionList, options: options)
        albums.append(contentsOf: self.exportCollections(collections: collectionsInFolder, with: options, in: collectionList.localizedTitle))
      }
    }

    return albums
  }

  private func exportCollection(_ collection: PHAssetCollection?, folderName: String? = nil) -> [String: Any?]? {
    guard let collection else {
      return nil
    }

    return [
      "id": assetIdFromLocalId(localId: collection.localIdentifier),
      "title": collection.localizedTitle,
      "folderName": folderName,
      "type": stringifyAlbumType(type: collection.assetCollectionType),
      "assetCount": assetCountOfCollection(collection),
      "startTime": exportDate(collection.startDate),
      "endTime": exportDate(collection.endDate),
      "approximateLocation": exportLocation(location: collection.approximateLocation),
      "locationNames": collection.localizedLocationNames
    ]
  }

  private func exportLocation(location: CLLocation?) -> [String: String]? {
    guard let location else {
      return nil
    }

    return [
      "latitude": "\(location.coordinate.latitude)",
      "longitude": "\(location.coordinate.longitude)"
    ]
  }

  private func stringifyAlbumType(type: PHAssetCollectionType) -> String {
    switch type {
    case.album:
      return "album"
    case .moment:
      return "moment"
    case .smartAlbum:
      return "smartAlbum"
    }
  }

  func assetCountOfCollection(_ collection: PHAssetCollection) -> Int {
    if collection.estimatedAssetCount == NSNotFound {
      let options = PHFetchOptions()
      options.includeHiddenAssets = false
      options.includeAllBurstAssets = false

      return PHAsset.fetchAssets(in: collection, options: options).count
    }
    return collection.estimatedAssetCount
  }

  private func requesterClass(_ writeOnly: Bool) -> EXPermissionsRequester.Type {
    if writeOnly {
      return MediaLibraryWriteOnlyPermissionRequester.self
    } else {
      return MediaLibraryPermissionRequester.self
    }
  }

  private func checkPermissions(promise: Promise) -> Bool {
    guard let permissions = appContext?.permissions else {
      promise.reject(MediaLibraryPermissionsException())
      return false
    }
    let permission = permissions.hasGrantedPermission(usingRequesterClass: requesterClass(self.writeOnly))
    if !permissions.hasGrantedPermission(usingRequesterClass: requesterClass(self.writeOnly)) {
      promise.reject(MediaLibraryPermissionsException())
      return false
    }
    return true
  }

  private func assetType(for localUri: URL) -> PHAssetMediaType {
    let fileUTI: CFString?

    if #available(iOS 14.0, *) {
      UTType(filenameExtension: localUri.pathExtension)
      let type: CFString = UTType(filenameExtension: localUri.pathExtension)?.identifier as! CFString
      fileUTI = type
    } else {
      fileUTI = UTTypeCreatePreferredIdentifierForTag(
        kUTTagClassFilenameExtension,
        localUri.pathExtension as CFString, nil
      )?.takeUnretainedValue()
    }

    guard let fileUTI else {
      return assetTypeExtension(for: localUri.pathExtension)
    }

    if UTTypeConformsTo(fileUTI, kUTTypeImage) {
      return .image
    }
    if UTTypeConformsTo(fileUTI, kUTTypeMovie) {
      return .video
    }
    if UTTypeConformsTo(fileUTI, kUTTypeAudio) {
      return .audio
    }

    return .unknown
  }

  private func getAssetBy(id: String?) -> PHAsset? {
    if let id {
      return getAssetsBy(assetIds: [id]).firstObject
    }

    return nil
  }

  private func getAssetsBy(assetIds: [String]) -> PHFetchResult<PHAsset> {
    let options = PHFetchOptions()
    options.includeHiddenAssets = true
    options.includeAllBurstAssets = true
    options.fetchLimit = assetIds.count
    return PHAsset.fetchAssets(withLocalIdentifiers: assetIds, options: options)
  }

  private func assetTypeExtension(for fileExtension: String) -> PHAssetMediaType {
    let extensionLookupFallback: [String: PHAssetMediaType] = [
      "jpeg": .image,
      "jpg": .image,
      "jpe": .image,
      "png": .image,
      "mp3": .audio,
      "mpga": .audio,
      "mov": .video,
      "qt": .video,
      "mpg": .video,
      "mpeg": .video,
      "mpe": .video,
      "m75": .video,
      "m15": .video,
      "m2v": .video,
      "ts": .video,
      "mp4": .video,
      "mpg4": .video,
      "m4p": .video,
      "avi": .video,
      "vfw": .video,
      "aiff": .audio,
      "aif": .audio,
      "wav": .audio,
      "wave": .audio,
      "bwf": .audio,
      "midi": .audio,
      "mid": .audio,
      "smf": .audio,
      "kar": .audio,
      "tiff": .image,
      "tif": .image,
      "gif": .image,
      "qtif": .image,
      "qti": .image,
      "icns": .image
    ]

    log.warn("Asset media type is recognized from file extension and this behavior can differ on iOS Simulator and a physical device.")
    let fallbackMediaType = extensionLookupFallback[fileExtension]

    if let fallbackMediaType {
      return fallbackMediaType
    }
    return .unknown
  }

  private func exportAsset(asset: PHAsset?) -> [String: Any?]? {
    guard let asset else {
      return nil
    }
    let fileName = asset.value(forKey: "filename")
    return [
      "id": asset.localIdentifier,
      "filename": fileName,
      "uri": assetUriForLocalId(localId: asset.localIdentifier),
      "mediaType": stringify(mediaType: asset.mediaType),
      "mediaSubtypes": stringifyMedia(mediaSubtypes: asset.mediaSubtypes),
      "width": asset.pixelWidth,
      "height": asset.pixelHeight,
      "creationTime": exportDate(asset.creationDate),
      "modificationTime": exportDate(asset.modificationDate),
      "duration": asset.duration
    ]
  }

  private func assetIdFromLocalId(localId: String) -> String? {
    if let range = localId.range(of: "/.*", options: .regularExpression) {
      let substring = String(localId[..<range.lowerBound])
      return substring

    }
    return nil
  }

  private func assetUriForLocalId(localId: String) -> String {
    let assetId = assetIdFromLocalId(localId: localId)
    return String(format: "ph://\(localId)")
  }

  private func stringify(mediaType: PHAssetMediaType) -> String {
    switch mediaType {
    case .audio:
      return "audio"
    case .image:
      return "photo"
    case .video:
      return "video"
    default:
      return "unknown"
    }
  }

  private func stringifyMedia(mediaSubtypes: PHAssetMediaSubtype) -> [String] {
    var subtypes = [String]()
    var subtypesDict: [NSString: PHAssetMediaSubtype] = [
      "hdr": PHAssetMediaSubtype.photoHDR,
      "panorama": PHAssetMediaSubtype.photoPanorama,
      "stream": PHAssetMediaSubtype.videoStreamed,
      "timelapse": PHAssetMediaSubtype.videoTimelapse,
      "screenshot": PHAssetMediaSubtype.photoScreenshot,
      "highFrameRate": PHAssetMediaSubtype.videoHighFrameRate
    ]

    subtypesDict["livePhoto"] = PHAssetMediaSubtype.photoLive
    subtypesDict["depthEffect"] = PHAssetMediaSubtype.photoDepthEffect

    for (subtype, value) in subtypesDict {
      if mediaSubtypes.contains(value) {
        subtypes.append(subtype as String)
      }
    }
    return subtypes
  }

  private func exportDate(_ date: Date?) -> Double? {
    if let date = date {
      let interval = date.timeIntervalSince1970
      return  interval * 1000
    }
    return nil
  }

  private func runIfAllPermissionsWereGranted(reject: @escaping EXPromiseRejectBlock, block: @escaping () -> Void) {
    appContext?.permissions?.getPermissionUsingRequesterClass(MediaLibraryPermissionRequester.self, resolve: { result in
      if let permissions = result as? [String: Any] {
        if permissions["status"] as! String != "granted" {
          reject("E_NO_PERMISSIONS", "MEDIA_LIBRARY permission is required to do this operation.", nil)
          return
        }

        if #available(iOS 14.0, *) {
          if permissions["accessPrivileges"] as? String != "all" {
            reject("E_NO_PERMISSIONS", "MEDIA_LIBRARY permission is required to do this operation.", nil)
            return
          }
        }
      }
      block()
    }, reject: reject)
  }

  private func exportAssetInfo(asset: PHAsset) -> [String: Any?]? {
    if var assetDict = exportAsset(asset: asset) {
      assetDict["location"] = exportLocation(location: asset.location)
      assetDict["isFavorite"] = asset.isFavorite
      assetDict["isHidden"] = asset.isHidden
      return assetDict
    }
    return nil
  }

  private func getAssetsWithAfter(options: AssetWithOptions, collection: PHAssetCollection?, promise: Promise) {
    let fetchOptions = PHFetchOptions()
    var predicates: [NSPredicate] = []
    var response = [String: Any?]()
    var assets: [[String: Any]] = []

    var cursor: PHAsset?
    if let after = options.after {
      cursor = getAssetBy(id: after)

      if cursor == nil {
        promise.reject(CusrorException())
        return
      }
    }

    if !options.mediaType.isEmpty {
      let assetTypes = options.mediaType.contains(.all)
      ? nil
      : options.mediaType.map {
        NSNumber(value: $0.toPHMediaType().rawValue)
      }

      if let assetTypes {
        let predicate = NSPredicate(format: "mediaType IN %@", assetTypes)
        predicates.append(predicate)
      }
    }

    if !options.sortBy.isEmpty {
      do {
        fetchOptions.sortDescriptors = try prepareSortDescriptors(sortBy: options.sortBy)
      } catch {
        promise.reject(error)
        return
      }
    }

    if let createdAfter = options.createdAfter {
      if let date = EXUtilities.nsDate(createdAfter) {
        let predicate = NSPredicate(format: "creationDate > %@", date as CVarArg)
        predicates.append(predicate)
      }
    }

    if let createdBefore = options.createdBefore {
      if let date = EXUtilities.nsDate(createdBefore) {
        let predicate = NSPredicate(format: "creationDate < %@", date as CVarArg)
        predicates.append(predicate)
      }
    }

    if !predicates.isEmpty {
      let compoundPredicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
      fetchOptions.predicate = compoundPredicate
    }

    fetchOptions.includeAssetSourceTypes = PHAssetSourceType.typeUserLibrary
    fetchOptions.includeAllBurstAssets = false
    fetchOptions.includeHiddenAssets = false

    var fetchResult: PHFetchResult<PHAsset>
    if let collection {
      fetchResult = PHAsset.fetchAssets(in: collection, options: fetchOptions)
    } else {
      fetchResult = PHAsset.fetchAssets(with: fetchOptions)
    }

    var cursorIndex: Int
    if let cursor {
      cursorIndex = fetchResult.index(of: cursor)
    } else {
      cursorIndex = NSNotFound
    }

    let totalCount = fetchResult.count
    var hasNextPage: Bool

    if fetchOptions.sortDescriptors?.isEmpty == true {
      let startIndex = max(cursorIndex == NSNotFound ? totalCount - 1: cursorIndex - 1, -1)
      let endIndex = max(startIndex - options.first + 1, 0)

      for i in (endIndex...startIndex).reversed() {
        let asset = fetchResult.object(at: i)
        if let exportedAsset = exportAsset(asset: asset) {
          assets.append(exportedAsset)
        }
      }

      hasNextPage = endIndex > 0
    } else {
      let startIndex = cursorIndex == NSNotFound ? 0 : cursorIndex + 1
      let endIndex = min(startIndex + options.first, totalCount)

      for i in startIndex..<endIndex {
        let asset = fetchResult.object(at: i)
        if let exportedAsset = exportAsset(asset: asset) {
          assets.append(exportedAsset)
        }
      }

      hasNextPage = endIndex < totalCount
    }

    let lastAsset = assets.last

    response["assets"] = assets
    response["endCursor"] = lastAsset != nil ? lastAsset?["id"] : options.after
    response["hasNextPage"] = hasNextPage
    response["totalCount"] = totalCount

    promise.resolve(response)
  }

  private func prepareSortDescriptors(sortBy: [String]) throws -> [NSSortDescriptor] {
    var descriptors = [NSSortDescriptor]()

    for config in sortBy {
      if let sortDescriptor = try sortDescriptor(from: config) {
        descriptors.append(sortDescriptor)
      }
    }

    return descriptors
  }

  private func sortDescriptor(from config: String) throws -> NSSortDescriptor? {
    let parts = config.components(separatedBy: " ")
    let key = try convertSortByKey(parts[0])

    var ascending = false
    if parts.count > 1 && parts[1] == "ASC" {
      ascending = true
    }

    return NSSortDescriptor(key: key, ascending: ascending)
  }

  private func convertSortByKey(_ key: String) throws -> String? {
    if key == "default" {
      return nil
    }

    let conversionDict: [String: String] = [
      "creationTime": "creationDate",
      "modificationTime": "modificationDate",
      "mediaType": "mediaType",
      "width": "pixelWidth",
      "height": "pixelHeight",
      "duration": "duration"
    ]

    guard let value = conversionDict[key] else {
      throw SortByKeyException(key)
    }

    return value
  }

  func didChange(_ changeInstance: PHChange) {
    if let allAssetsFetchResult {
      let changeDetails = changeInstance.changeDetails(for: allAssetsFetchResult)

      if let changeDetails {
        self.allAssetsFetchResult = changeDetails.fetchResultAfterChanges

        if changeDetails.hasIncrementalChanges && !changeDetails.insertedObjects.isEmpty || !changeDetails.removedObjects.isEmpty {
          var insertedAssets = [[String: Any]?]()
          var deletedAssets = [[String: Any]?]()
          var updatedAssets = [[String: Any]?]()
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
