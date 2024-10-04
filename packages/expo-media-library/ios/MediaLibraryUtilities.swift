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
  var subtypes = [String]()
  var subtypesDict: [String: PHAssetMediaSubtype] = [
    "hdr": PHAssetMediaSubtype.photoHDR,
    "panorama": PHAssetMediaSubtype.photoPanorama,
    "stream": PHAssetMediaSubtype.videoStreamed,
    "timelapse": PHAssetMediaSubtype.videoTimelapse,
    "screenshot": PHAssetMediaSubtype.photoScreenshot,
    "highFrameRate": PHAssetMediaSubtype.videoHighFrameRate
  ]

  subtypesDict["livePhoto"] = PHAssetMediaSubtype.photoLive
  subtypesDict["depthEffect"] = PHAssetMediaSubtype.photoDepthEffect

  for (subtype, value) in subtypesDict where mediaSubtypes.contains(value) {
    subtypes.append(subtype as String)
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
    "creationTime": exportDate(asset.creationDate),
    "modificationTime": exportDate(asset.modificationDate),
    "duration": asset.duration
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
  let assetId = assetIdFromLocalId(localId: localId)
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

func assetType(for localUri: URL) -> PHAssetMediaType {
  let fileUTI: CFString?

  if #available(iOS 14.0, *) {
    if let type = UTType(filenameExtension: localUri.pathExtension)?.identifier as CFString? {
      fileUTI = type
    } else {
      fileUTI = nil
    }
  } else {
    fileUTI = UTTypeCreatePreferredIdentifierForTag(
      kUTTagClassFilenameExtension,
      localUri.pathExtension as CFString,
      nil
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
    let startIndex = max(cursorIndex == NSNotFound ? totalCount - 1 : cursorIndex - 1, -1)
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

    for index in startIndex..<endIndex {
      let asset = fetchResult.object(at: index)
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

func requesterClass(_ writeOnly: Bool) -> EXPermissionsRequester.Type {
  if writeOnly {
    return MediaLibraryWriteOnlyPermissionRequester.self
  }
  return MediaLibraryPermissionRequester.self
}
