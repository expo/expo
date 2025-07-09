import Photos
import UIKit

typealias SaveToLibraryCallback = (Any?, Error?) -> Void

class SaveToLibraryDelegate: NSObject {
  var callback: SaveToLibraryCallback?

  #if os(iOS)
  func writeImage(_ image: UIImage, withCallback callback: @escaping SaveToLibraryCallback) {
    self.callback = callback
    UIImageWriteToSavedPhotosAlbum(
      image,
      self,
      #selector(image(_:didFinishSavingWithError:contextInfo:)),
      nil
    )
  }

  func writeVideo(_ movieUrl: URL, withCallback callback: @escaping SaveToLibraryCallback) {
    self.callback = callback
    UISaveVideoAtPathToSavedPhotosAlbum(
      movieUrl.path,
      self,
      #selector(video(_:didFinishSavingWithError:contextInfo:)),
      nil
    )
  }

  func writeGIF(_ gifUrl: URL, withCallback callback: @escaping SaveToLibraryCallback) {
    self.callback = callback
    PHPhotoLibrary.shared().performChanges {
      if let data = try? Data(contentsOf: gifUrl) {
        let request = PHAssetCreationRequest.forAsset()
        request.addResource(with: .photo, data: data, options: nil)
      }
    } completionHandler: { _, error in
      self.triggerCallback(nil, with: error)
    }
  }

  @objc func image(_ image: UIImage, didFinishSavingWithError error: NSError?, contextInfo info: UnsafeMutableRawPointer) {
    triggerCallback(image, with: error)
  }

  @objc func video(_ videoPath: String, didFinishSavingWithError error: NSError?, contextInfo: UnsafeMutableRawPointer) {
    triggerCallback(videoPath, with: error)
  }

  func triggerCallback(_ asset: Any?, with error: Error?) {
    callback?(asset, error)
  }
  #endif
}
