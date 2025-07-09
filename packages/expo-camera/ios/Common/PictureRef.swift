import ExpoModulesCore

/**
 Represents a shared reference to the `UIImage` instance.
 */
internal final class PictureRef: SharedRef<UIImage> {
  override var nativeRefType: String {
    "image"
  }

  override func getAdditionalMemoryPressure() -> Int {
    guard let cgImage = ref.cgImage else {
      return 0
    }
    return cgImage.bytesPerRow * cgImage.height
  }
}
