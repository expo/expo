import ExpoModulesCore
import PhotosUI

protocol PhotoLibraryObserverHandler {
  func didChange(_ changeInstance: PHChange)
}

class PhotoLibraryObserver: NSObject, PHPhotoLibraryChangeObserver {
  let handler: PhotoLibraryObserverHandler

  init(handler: PhotoLibraryObserverHandler) {
    self.handler = handler
  }

  func photoLibraryDidChange(_ changeInstance: PHChange) {
    handler.didChange(changeInstance)
  }
}
