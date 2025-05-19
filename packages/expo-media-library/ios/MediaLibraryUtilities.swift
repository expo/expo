import ExpoModulesCore
import Photos
import CoreServices

func stringify(mediaType: PHAssetMediaType) -> String {
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

func stringifyMedia(mediaSubtypes: PHAssetMediaSubtype) -> [String] {
  let subtypesDict: [String: PHAssetMediaSubtype] = [
    "hdr": .photoHDR,
    "panorama": .photoPanorama,
    "stream": .videoStreamed,
    "timelapse": .videoTimelapse,
    "screenshot": .photoScreenshot,
    "highFrameRate": .videoHighFrameRate,
    "livePhoto": .photoLive,
    "depthEffect": .photoDepthEffect
  ]

  var subtypes = [String]()
  for (subtype, value) in subtypesDict where mediaSubtypes.contains(value) {
    subtypes.append(subtype)
  }
  return subtypes
}

func exportDate(_ date: Date?) -> Double? {
  if let date = date {
    let interval = date.timeIntervalSince1970
    return  interval * 1000
  }
  return nil
}

func stringifyAlbumType(type: PHAssetCollectionType) -> String {
  switch type {
  case.album:
    return "album"
  case .moment:
    return "moment"
  case .smartAlbum:
    return "smartAlbum"
  @unknown default:
    log.error("Unhandled `PHAssetCollectionType` value: \(type), returning `album` as fallback. Add the missing case as soon as possible.")
    return "album"
  }
}

func exportAssetInfo(asset: PHAsset) -> [String: Any?]? {
  if var assetDict = exportAsset(asset: asset) {
    assetDict["location"] = exportLocation(location: asset.location)
    assetDict["isFavorite"] = asset.isFavorite
    assetDict["isHidden"] = asset.isHidden
    return assetDict
  }
  return nil
}

func exportAsset(asset: PHAsset?) -> [String: Any?]? {
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
    // Uses required reason API based on the following reason: 0A2A.1
    "creationTime": exportDate(asset.creationDate),
    // Uses required reason API based on the following reason: 0A2A.1
    "modificationTime": exportDate(asset.modificationDate),
    "duration": asset.duration,
    "pairedVideoAsset": nil
  ]
}

func exportLocation(location: CLLocation?) -> [String: String]? {
  guard let location else {
    return nil
  }

  return [
    "latitude": "\(location.coordinate.latitude)",
    "longitude": "\(location.coordinate.longitude)"
  ]
}

func assetIdFromLocalId(localId: String) -> String? {
  if let range = localId.range(of: "/.*", options: .regularExpression) {
    return String(localId[..<range.lowerBound])
  }
  return nil
}

func assetUriForLocalId(localId: String) -> String {
  return String(format: "ph://\(localId)")
}

func getAllAssets() -> PHFetchResult<PHAsset> {
  let options = PHFetchOptions()
  options.includeAssetSourceTypes = PHAssetSourceType.typeUserLibrary
  options.includeHiddenAssets = false
  options.includeHiddenAssets = false
  return PHAsset.fetchAssets(with: options)
}

func addAssets(ids: [String], to album: String, with callback: @escaping (Bool, Error?) -> Void) {
  PHPhotoLibrary.shared().performChanges({
    guard let collection = getAlbum(by: album) else {
      return
    }
    let assets = getAssetsBy(assetIds: ids)

    let collectionAssets = PHAsset.fetchAssets(in: collection, options: nil)
    let albumChangeRequest = PHAssetCollectionChangeRequest(for: collection, assets: collectionAssets)
    albumChangeRequest?.addAssets(assets as NSFastEnumeration)
  }, completionHandler: callback)
}

func getAlbum(by id: String) -> PHAssetCollection? {
  let options = PHFetchOptions()
  options.fetchLimit = 1
  return PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: [id], options: options).firstObject
}

func getAlbum(with title: String) -> PHAssetCollection? {
  let options = PHFetchOptions()
  options.predicate = NSPredicate(format: "title == %@", title)
  options.fetchLimit = 1

  let fetchResult = PHAssetCollection.fetchAssetCollections(with: .album, subtype: .any, options: options)

  return fetchResult.firstObject
}

func getAlbums(by ids: [String]) -> PHFetchResult<PHAssetCollection> {
  let options = PHFetchOptions()
  return PHAssetCollection.fetchAssetCollections(withLocalIdentifiers: ids, options: options)
}

func getAssetBy(id: String?) -> PHAsset? {
  if let id {
    return getAssetsBy(assetIds: [id]).firstObject
  }

  return nil
}

func getAssetsBy(assetIds: [String]) -> PHFetchResult<PHAsset> {
  let options = PHFetchOptions()
  options.includeHiddenAssets = true
  options.includeAllBurstAssets = true
  options.fetchLimit = assetIds.count
  return PHAsset.fetchAssets(withLocalIdentifiers: assetIds, options: options)
}

func exportCollections(
  collections: PHFetchResult<PHCollection>,
  with options: PHFetchOptions,
  in folder: String?) -> [[String: Any?]?] {
  var albums = [[String: Any?]?]()
  collections.enumerateObjects { collection, _, _ in
    if let assetCollection = collection as? PHAssetCollection {
      if let folder {
        albums.append(
          exportCollection(assetCollection, folderName: folder))
      } else {
        albums.append(exportCollection(assetCollection, folderName: nil))
      }
    } else if let collectionList = collection as? PHCollectionList {
      let collectionsInFolder = PHCollectionList.fetchCollections(in: collectionList, options: options)
      albums.append(contentsOf: exportCollections(collections: collectionsInFolder, with: options, in: collectionList.localizedTitle))
    }
  }

  return albums
}

func exportCollections(collections: PHFetchResult<PHAssetCollection>, with options: PHFetchOptions, in folder: String?) -> [[String: Any?]?] {
  var albums = [[String: Any?]?]()
  collections.enumerateObjects { collection, _, _ in
    if let assetCollection = collection as? PHAssetCollection {
      if let folder {
        albums.append(
          exportCollection(assetCollection, folderName: folder))
      } else {
        albums.append(exportCollection(assetCollection, folderName: nil))
      }
    } else if let collectionList = collection as? PHCollectionList {
      let collectionsInFolder = PHCollectionList.fetchCollections(in: collectionList, options: options)
      albums.append(contentsOf: exportCollections(collections: collectionsInFolder, with: options, in: collectionList.localizedTitle))
    }
  }

  return albums
}

func exportCollection(_ collection: PHAssetCollection?, folderName: String? = nil) -> [String: Any?]? {
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

private func assetCountOfCollection(_ collection: PHAssetCollection) -> Int {
  if collection.estimatedAssetCount == NSNotFound {
    let options = PHFetchOptions()
    options.includeHiddenAssets = false
    options.includeAllBurstAssets = false

    return PHAsset.fetchAssets(in: collection, options: options).count
  }
  return collection.estimatedAssetCount
}

func ensureAlbumWith(title: String, completion: @escaping (PHAssetCollection?, Error?) -> Void) {
  if let collection = getAlbum(with: title) {
    completion(collection, nil)
    return
  }
  createAlbum(with: title, completion: completion)
}

func createAlbum(with title: String, completion: @escaping (PHAssetCollection?, Error?) -> Void) {
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

func createAsset(uri: URL, appContext: AppContext?, completion: @escaping (PHAsset?, Error?) -> Void) {
  let assetType = assetType(for: uri)

  if uri.pathExtension.isEmpty {
    completion(nil, EmptyFileExtensionException())
    return
  }

  if assetType == .unknown || assetType == .audio {
    completion(nil, UnsupportedAssetTypeException(uri.absoluteString))
    return
  }

  if !FileSystemUtilities.permissions(appContext, for: uri).contains(.read) {
    completion(nil, UnreadableAssetException(uri.absoluteString))
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
      completion(asset, nil)
    } else {
      completion(nil, SaveAssetException(error))
    }
  }
}

func assetType(for localUri: URL) -> PHAssetMediaType {
  guard let type = UTType(filenameExtension: localUri.pathExtension) else {
    return assetTypeExtension(for: localUri.pathExtension)
  }
  switch type {
  case .image:
    return .image
  case .video, .movie:
    return .video
  case .audio:
    return .audio
  case _ where type.conforms(to: .image):
    return .image
  case _ where type.conforms(to: .video) || type.conforms(to: .movie):
    return .video
  case _ where type.conforms(to: .audio):
    return .audio
  default:
    return .unknown
  }
}

func assetTypeExtension(for fileExtension: String) -> PHAssetMediaType {
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

  let fallbackMediaType = extensionLookupFallback[fileExtension]

  if let fallbackMediaType {
    return fallbackMediaType
  }
  return .unknown
}

func getAssetsWithAfter(options: AssetWithOptions, collection: PHAssetCollection?, promise: Promise) {
  let fetchOptions = PHFetchOptions()
  var predicates: [NSPredicate] = []

  var cursor: PHAsset?
  if let after = options.after {
    cursor = getAssetBy(id: after)

    if cursor == nil {
      promise.reject(CursorException())
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

  var cursorIndex: Int {
    if let cursor {
      return fetchResult.index(of: cursor)
    }
    return NSNotFound
  }

  let resultingAssets = getAssets(
    fetchResult: fetchResult,
    cursorIndex: cursorIndex,
    numOfRequestedItems: options.first,
    sortDescriptors: fetchOptions.sortDescriptors
  )

  let lastAsset = resultingAssets.assets.last

  let response: [String: Any?] = [
    "assets": resultingAssets.assets,
    "endCursor": lastAsset?["id"] ?? options.after,
    "hasNextPage": resultingAssets.hasNextPage,
    "totalCount": resultingAssets.totalCount
  ]
  promise.resolve(response)
}

func getAssets(
  fetchResult: PHFetchResult<PHAsset>,
  cursorIndex: Int,
  numOfRequestedItems: Int,
  sortDescriptors: [NSSortDescriptor]? = nil
) -> GetAssetsResponse {
  let totalCount = fetchResult.count
  if totalCount == 0 {
    return GetAssetsResponse(assets: [], totalCount: totalCount, hasNextPage: false)
  }

  var assets: [[String: Any?]] = []
  assets.reserveCapacity(numOfRequestedItems)
  var hasNextPage: Bool

  // If we don't use any sort descriptors (nil, or empty array), the assets are sorted just like in Photos app.
  // That means the most recent assets are at the start of the array.
  if sortDescriptors?.isEmpty ?? true {
    let upperIndex = max(cursorIndex == NSNotFound ? totalCount - 1 : cursorIndex - 1, -1)
    let lowerIndex = max(upperIndex - numOfRequestedItems, -1)

    for i in stride(from: upperIndex, to: lowerIndex, by: -1) {
      let asset = fetchResult.object(at: i)
      if let exportedAsset = exportAsset(asset: asset) {
        assets.append(exportedAsset)
      }
    }

    hasNextPage = lowerIndex >= 0
  } else {
    let startIndex = cursorIndex == NSNotFound ? 0 : cursorIndex + 1
    let endIndex = min(startIndex + numOfRequestedItems, totalCount)

    for index in startIndex..<endIndex {
      let asset = fetchResult.object(at: index)
      if let exportedAsset = exportAsset(asset: asset) {
        assets.append(exportedAsset)
      }
    }

    hasNextPage = endIndex < totalCount
  }
  return GetAssetsResponse(assets: assets, totalCount: totalCount, hasNextPage: hasNextPage)
}

func prepareSortDescriptors(sortBy: [String]) throws -> [NSSortDescriptor] {
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
  guard let key = try convertSortByKey(parts[0]) else {
    return nil
  }

  let ascending = parts.count > 1 && parts[1] == "ASC"

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

func requesterClass(_ writeOnly: Bool) -> EXPermissionsRequester.Type {
  if writeOnly {
    return MediaLibraryWriteOnlyPermissionRequester.self
  }
  return MediaLibraryPermissionRequester.self
}

func readSizeFrom(url: URL) -> CGSize? {
  let asset = AVURLAsset(url: url)
  guard let assetTrack = asset.tracks(withMediaType: .video).first else {
    return nil
  }
  // The video could be rotated and the resulting transform can result in a negative width/height.
  let size = assetTrack.naturalSize.applying(assetTrack.preferredTransform)
  return CGSize(width: abs(size.width), height: abs(size.height))
}

func getFileExtension(from fileName: String) -> String {
  return ".\(URL(fileURLWithPath: fileName).pathExtension)"
}
