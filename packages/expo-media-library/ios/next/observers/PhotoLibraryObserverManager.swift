import Photos

typealias OnMediaLibraryChange = ([String: Any]) -> Void

class PhotoLibraryObserverManager: NSObject, PHPhotoLibraryChangeObserver {
  private let onChange: OnMediaLibraryChange
  private var assetsFetchResult: PHFetchResult<PHAsset>?

  init(onChange: @escaping OnMediaLibraryChange) {
    self.onChange = onChange
  }

  func startObserving() {
    guard assetsFetchResult == nil else {
      return
    }
    assetsFetchResult = fetchAssets()
    PHPhotoLibrary.shared().register(self)
  }

  func stopObserving() {
    PHPhotoLibrary.shared().unregisterChangeObserver(self)
    assetsFetchResult = nil
  }

  func photoLibraryDidChange(_ changeInstance: PHChange) {
    guard let assetsFetchResult else {
      return
    }
    guard let changeDetails = changeInstance.changeDetails(for: assetsFetchResult) else {
      return
    }

    self.assetsFetchResult = changeDetails.fetchResultAfterChanges
    if changeDetails.hasIncrementalChanges {
      onChange([
        "hasIncrementalChanges": true,
        "insertedAssets": changeDetails.insertedObjects.map { asset in "ph://\(asset.localIdentifier)" },
        "deletedAssets": changeDetails.removedObjects.map { asset in "ph://\(asset.localIdentifier)" },
        "updatedAssets": changeDetails.changedObjects.map { asset in "ph://\(asset.localIdentifier)" }
      ])
    } else {
      onChange([
        "hasIncrementalChanges": false
      ])
    }
  }

  private func fetchAssets() -> PHFetchResult<PHAsset> {
    let options = PHFetchOptions()
    options.includeAssetSourceTypes = PHAssetSourceType.typeUserLibrary
    options.includeHiddenAssets = false
    return PHAsset.fetchAssets(with: options)
  }
}
